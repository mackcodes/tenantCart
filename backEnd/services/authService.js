import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Tenant from "../models/Tenant.js";

import sendEmail from "../utils/sendEmail.js";
import {evaluateTenant} from "../services/tenantVerificationService.js";

const sendVerificationEmail = async (user) => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  );

  await user.save({ validateBeforeSave: false });

  const clientUrl =
    process.env.CLIENT_URL || "http://localhost:3000";

  const verifyUrl = `${clientUrl}/verify-email/${rawToken}`;

  const html = `
    <!doctype html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #24342d;">
        <h2>Verify your TenantCart email</h2>

        <p>Hello ${user.name},</p>

        <p>Confirm this is your email address to finish setting up your account.</p>

        <p>
          <a
            href="${verifyUrl}"
            style="
              display: inline-block;
              padding: 12px 18px;
              background: #24342d;
              color: #ffffff;
              text-decoration: none;
              border-radius: 4px;
            "
          >
            Verify email
          </a>
        </p>

        <p>This link expires in 24 hours.</p>

        <p>TenantCart</p>
      </body>
    </html>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: "Verify your TenantCart email",
      html,
    });
  } catch (emailError) {
    console.error("Verification email failed:", emailError);
  }
};

export const createAccount = async ({
  name,
  email,
  password,
}) => {
  if (password.length < 8) {
    throw Object.assign(
      new Error(
        "Password must be at least 8 characters"
      ),
      {
        statusCode: 400,
      }
    );
  }
  const normalizedEmail = email
    .trim()
    .toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw Object.assign(
      new Error("Email already registered"),
      {
        statusCode: 409,
      }
    );
  }

  const passwordHash = await bcrypt.hash(
    password,
    10
  );

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
  });

  await sendVerificationEmail(user);

  return user;
};

export const verifyEmail = async (rawToken) => {
  if (!rawToken) {
    throw Object.assign(
      new Error("Verification token is required"),
      { statusCode: 400 }
    );
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    throw Object.assign(
      new Error("Verification link is invalid"),
      { statusCode: 400 }
    );
  }

  if (user.emailVerified) {
    return { user, alreadyVerified: true };
  }

  if (
    !user.emailVerificationExpires ||
    user.emailVerificationExpires < new Date()
  ) {
    throw Object.assign(
      new Error("Verification link has expired"),
      { statusCode: 400 }
    );
  }

  user.emailVerified = true;

  await user.save();

  if (user.tenant) {
    await Tenant.updateOne(
      { _id: user.tenant },
      { $set: { emailVerified: true } }
    );

    await evaluateTenant(user.tenant);
  }

  return { user, alreadyVerified: false };
};

export const resendVerificationEmail = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user || user.emailVerified) {
    return;
  }

  await sendVerificationEmail(user);
};

export const createStoreForUser = async (
  userId,
  storeData
) => {
  const existingUser = await User.findById(
    userId
  );

  if (!existingUser) {
    throw Object.assign(
      new Error("User not found"),
      {
        statusCode: 404,
      }
    );
  }

  if (existingUser.tenant) {
    throw Object.assign(
      new Error(
        "This account already has a store"
      ),
      {
        statusCode: 409,
      }
    );
  }

  const normalizedSlug =
    storeData.slug?.trim().toLowerCase();

  if (!normalizedSlug) {
    throw Object.assign(
      new Error("Store slug is required"),
      {
        statusCode: 400,
      }
    );
  }

  const existingTenant =
    await Tenant.findOne({
      slug: normalizedSlug,
    });

  if (existingTenant) {
    throw Object.assign(
      new Error("Store URL already taken"),
      {
        statusCode: 409,
      }
    );
  }

  const safeStoreData = {
    storeName: storeData.storeName
      ?.trim(),

    slug: normalizedSlug,

    description: storeData.description
      ?.trim(),

    category: storeData.category
      ?.trim(),

    businessEmail: storeData.businessEmail
      ?.trim()
      .toLowerCase(),

    businessPhone: storeData.businessPhone
      ?.trim(),

    address: storeData.address,

    branding: storeData.branding,
  };

  const tenant = await Tenant.create({
    ...safeStoreData,
    owner: userId,
    status: "pending_verification",
    emailVerified: existingUser.emailVerified === true,
  });

  const evaluatedTenant =
    await evaluateTenant(tenant._id);

  const updatedUser =
    await User.findByIdAndUpdate(
      userId,
      {
        tenant: evaluatedTenant._id,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-passwordHash")
      .populate("tenant");

  if (!updatedUser) {
    throw Object.assign(
      new Error("User could not be updated"),
      {
        statusCode: 500,
      }
    );
  }

  return {
    tenant: evaluatedTenant,
    user: updatedUser,
  };
};

export const validateLogin = async (
  email,
  password
) => {
  const normalizedEmail = email
    .trim()
    .toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).populate("tenant");

  if (!user) {
    throw Object.assign(
      new Error("Invalid credentials"),
      {
        statusCode: 401,
      }
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw Object.assign(
      new Error("Invalid credentials"),
      {
        statusCode: 401,
      }
    );
  }

  return user;
};

export const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is missing from environment variables"
    );
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

export const requestPasswordReset = async (
  email
) => {
  const normalizedEmail = email
    .trim()
    .toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  /*
   * Do not reveal whether an email exists.
   * The controller will return the same response
   * whether the user is found or not.
   */
  if (!user) {
    return;
  }

  const rawToken = crypto
    .randomBytes(32)
    .toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;

  user.resetPasswordExpires = new Date(
    Date.now() + 15 * 60 * 1000
  );

  await user.save({
    validateBeforeSave: false,
  });

  const clientUrl =
    process.env.CLIENT_URL ||
    "http://localhost:3000";

  const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

  const html = `
    <!doctype html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #24342d;">
        <h2>Reset your TenantCart password</h2>

        <p>Hello ${user.name},</p>

        <p>
          We received a request to reset your TenantCart password.
        </p>

        <p>
          <a
            href="${resetUrl}"
            style="
              display: inline-block;
              padding: 12px 18px;
              background: #24342d;
              color: #ffffff;
              text-decoration: none;
              border-radius: 4px;
            "
          >
            Reset password
          </a>
        </p>

        <p>
          This link expires in 15 minutes.
        </p>

        <p>
          If you did not request a password reset, you can safely ignore this email.
        </p>

        <p>
          TenantCart
        </p>
      </body>
    </html>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your TenantCart password",
      html,
    });
  } catch (emailError) {
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save({
      validateBeforeSave: false,
    });

    console.error(
      "Password reset email failed:",
      emailError
    );

    throw Object.assign(
      new Error(
        "Unable to send reset email. Please try again later."
      ),
      {
        statusCode: 500,
      }
    );
  }
};

export const resetPassword = async (
  rawToken,
  newPassword
) => {
  if (newPassword.length < 8) {
    throw Object.assign(
      new Error(
        "Password must be at least 8 characters"
      ),
      {
        statusCode: 400,
      }
    );
  }
  if (!rawToken) {
    throw Object.assign(
      new Error("Reset token is required"),
      {
        statusCode: 400,
      }
    );
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: {
      $gt: new Date(),
    },
  }).select(
    "+resetPasswordToken +resetPasswordExpires"
  );

  if (!user) {
    throw Object.assign(
      new Error(
        "Reset link is invalid or has expired"
      ),
      {
        statusCode: 400,
      }
    );
  }

  const passwordHash = await bcrypt.hash(
    newPassword,
    10
  );

  user.passwordHash = passwordHash;
  user.passwordChangedAt = new Date();
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;

  await user.save();

  return user;
};