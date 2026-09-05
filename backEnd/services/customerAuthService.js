import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import Tenant from "../models/Tenant.js";
import sendEmail from "../utils/sendEmail.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

export const hashToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

const getApprovedTenant = async (slug) => {
  const tenant = await Tenant.findOne({
    slug: slug?.trim().toLowerCase(),
    status: "approved",
  }).select("_id storeName slug");

  if (!tenant) {
    throw Object.assign(new Error("Store not found or not approved"), {
      statusCode: 404,
    });
  }

  return tenant;
};

const sendVerificationEmail = async (customer, tenant) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);

  customer.emailVerificationToken = hashedToken;
  customer.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await customer.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  // Link is scoped to the store slug so the verification endpoint can enforce
  // that the token belongs to this tenant and not another.
  const verifyUrl = `${clientUrl}/store/${tenant.slug}/verify-email/${rawToken}`;

  const html = `
    <!doctype html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #24342d;">
        <h2>Verify your email for ${tenant.storeName}</h2>
        <p>Hello ${customer.name},</p>
        <p>Confirm your email address to finish creating your account at ${tenant.storeName}.</p>
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
        <p>${tenant.storeName} via TenantCart</p>
      </body>
    </html>
  `;

  try {
    await sendEmail({
      to: customer.email,
      subject: `Verify your email for ${tenant.storeName}`,
      html,
    });
    return true;
  } catch (emailError) {
    console.error("Customer verification email failed:", emailError);
    return false;
  }
};

const sendPasswordResetEmail = async (customer, tenant) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);

  customer.resetPasswordToken = hashedToken;
  customer.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await customer.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const resetUrl = `${clientUrl}/store/${tenant.slug}/reset-password/${rawToken}`;

  const html = `
    <!doctype html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #24342d;">
        <h2>Reset your password for ${tenant.storeName}</h2>
        <p>Hello ${customer.name},</p>
        <p>We received a request to reset your password at ${tenant.storeName}.</p>
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
        <p>This link expires in 15 minutes.</p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <p>${tenant.storeName} via TenantCart</p>
      </body>
    </html>
  `;

  try {
    await sendEmail({
      to: customer.email,
      subject: `Reset your password for ${tenant.storeName}`,
      html,
    });
  } catch (emailError) {
    customer.resetPasswordToken = null;
    customer.resetPasswordExpires = null;
    await customer.save({ validateBeforeSave: false });
    console.error("Customer password-reset email failed:", emailError);
    throw Object.assign(
      new Error("Unable to send reset email. Please try again later."),
      { statusCode: 500 }
    );
  }
};

// ---------------------------------------------------------------------------
// Exported service functions
// ---------------------------------------------------------------------------

/**
 * Signs a JWT that embeds both the customer ID *and* the tenant ID.
 * The `kind: "customer"` claim prevents this token from being accepted by the
 * merchant `protect` middleware (which expects no `kind` claim), and vice versa.
 * `protectCustomer` additionally cross-checks tenantId against the store slug
 * in every request to prevent Store-A tokens from working on Store-B endpoints.
 */
export const signCustomerToken = (customer) => {
  const secret = process.env.JWT_SECRET || "test-secret";

  return jwt.sign(
    {
      sub: customer._id.toString(),
      tenantId: customer.tenant.toString(),
      kind: "customer",
    },
    secret,
    { expiresIn: process.env.CUSTOMER_JWT_EXPIRES_IN || "7d" }
  );
};

export const registerCustomer = async ({ slug, name, email, password }) => {
  if (password.length < 8) {
    throw Object.assign(
      new Error("Password must be at least 8 characters"),
      { statusCode: 400 }
    );
  }

  const tenant = await getApprovedTenant(slug);
  const normalizedEmail = email.trim().toLowerCase();

  let customer = await Customer.findOne({
    tenant: tenant._id,
    email: normalizedEmail,
  }).select("+passwordHash");

  if (customer?.passwordHash) {
    throw Object.assign(
      new Error("An account with this email already exists at this store"),
      { statusCode: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (customer) {
    // Guest customer record already exists — upgrade it with auth credentials.
    customer.name = name.trim();
    customer.passwordHash = passwordHash;
    customer.emailVerified = false;
    await customer.save({ validateBeforeSave: false });
  } else {
    customer = await Customer.create({
      tenant: tenant._id,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });
  }

  const emailSent = await sendVerificationEmail(customer, tenant);

  return { customer, tenant, emailSent };
};

export const loginCustomer = async ({ slug, email, password }) => {
  const tenant = await getApprovedTenant(slug);
  const normalizedEmail = email.trim().toLowerCase();

  const customer = await Customer.findOne({
    tenant: tenant._id,
    email: normalizedEmail,
  }).select("+passwordHash");

  if (!customer || !customer.passwordHash) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  const matches = await bcrypt.compare(password, customer.passwordHash);
  if (!matches) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  return { customer, tenant };
};

export const verifyCustomerEmail = async ({ slug, rawToken }) => {
  const tenant = await getApprovedTenant(slug);
  const hashedToken = hashToken(rawToken);

  const customer = await Customer.findOne({
    tenant: tenant._id,
    emailVerificationToken: hashedToken,
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!customer) {
    throw Object.assign(new Error("Verification link is invalid"), { statusCode: 400 });
  }

  if (customer.emailVerified) {
    return { customer, alreadyVerified: true };
  }

  if (
    !customer.emailVerificationExpires ||
    customer.emailVerificationExpires < new Date()
  ) {
    throw Object.assign(new Error("Verification link has expired"), { statusCode: 400 });
  }

  customer.emailVerified = true;
  customer.emailVerificationToken = null;
  customer.emailVerificationExpires = null;
  await customer.save({ validateBeforeSave: false });

  return { customer, alreadyVerified: false };
};

export const resendCustomerVerificationEmail = async ({ slug, email }) => {
  const tenant = await getApprovedTenant(slug);
  const normalizedEmail = email.trim().toLowerCase();

  const customer = await Customer.findOne({
    tenant: tenant._id,
    email: normalizedEmail,
  }).select("+passwordHash");

  // Silently succeed — don't reveal whether an account exists.
  if (!customer || !customer.passwordHash || customer.emailVerified) {
    return { emailSent: false };
  }

  const emailSent = await sendVerificationEmail(customer, tenant);
  return { emailSent };
};

export const requestCustomerPasswordReset = async ({ slug, email }) => {
  const tenant = await getApprovedTenant(slug);
  const normalizedEmail = email.trim().toLowerCase();

  const customer = await Customer.findOne({
    tenant: tenant._id,
    email: normalizedEmail,
  }).select("+passwordHash");

  // Do not reveal whether an account exists.
  if (!customer || !customer.passwordHash) {
    return;
  }

  await sendPasswordResetEmail(customer, tenant);
};

export const resetCustomerPassword = async ({ slug, rawToken, newPassword }) => {
  if (newPassword.length < 8) {
    throw Object.assign(
      new Error("Password must be at least 8 characters"),
      { statusCode: 400 }
    );
  }

  const tenant = await getApprovedTenant(slug);
  const hashedToken = hashToken(rawToken);

  const customer = await Customer.findOne({
    tenant: tenant._id,
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!customer) {
    throw Object.assign(
      new Error("Reset link is invalid or has expired"),
      { statusCode: 400 }
    );
  }

  customer.passwordHash = await bcrypt.hash(newPassword, 10);
  customer.passwordChangedAt = new Date();
  customer.resetPasswordToken = null;
  customer.resetPasswordExpires = null;
  await customer.save({ validateBeforeSave: false });

  return customer;
};
