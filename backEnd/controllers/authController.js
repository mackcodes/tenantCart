import User from "../models/User.js";
import { authCookieOptions, clearAuthCookieOptions } from "../config/cookieOptions.js";
import * as authService from "../services/authService.js";

export const registerAccount = async (
  req,
  res,
  next
) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    const user = await authService.createAccount({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    const token = authService.signToken(user);

    res.cookie("tenantcart_token", token, authCookieOptions);

    return res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: user.tenant,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerStore = async (
  req,
  res,
  next
) => {
  try {
    const {
      storeName,
      slug,
      description,
      category,
      businessEmail,
      businessPhone,
      address,
      branding,
    } = req.body;

    if (!storeName || !slug) {
      return res.status(400).json({
        message: "Store name and slug are required",
      });
    }

    const normalizedSlug = slug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    if (!normalizedSlug) {
      return res.status(400).json({
        message: "A valid store address is required",
      });
    }

    const result =
      await authService.createStoreForUser(
        req.user._id,
        {
          storeName: storeName.trim(),
          slug: normalizedSlug,
          description:
            description?.trim() || "",
          category: category || "other",
          businessEmail:
            businessEmail?.trim().toLowerCase() || "",
          businessPhone:
            businessPhone?.trim() || "",
          address: {
            line1:
              address?.line1?.trim() || "",
            line2:
              address?.line2?.trim() || "",
            city:
              address?.city?.trim() || "",
            state:
              address?.state?.trim() || "",
            postalCode:
              address?.postalCode?.trim() || "",
            country:
              address?.country?.trim() || "India",
          },
          branding: {
            logoUrl:
              branding?.logoUrl || "",
            primaryColor:
              branding?.primaryColor ||
              "#4F46E5",
            templateId:
              branding?.templateId ||
              "default",
          },
        }
      );

    return res.status(201).json({
      message: "Store created successfully",
      tenant: result.tenant,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req,
  res,
  next
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const user = await authService.validateLogin(
      email.trim().toLowerCase(),
      password
    );

    const token = authService.signToken(user);

    res.cookie("tenantcart_token", token, authCookieOptions);

    return res.json({
      message: "Login Successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: user.tenant,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req,
  res,
  next
) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-passwordHash")
      .populate("tenant");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req,
  res,
  next
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    await authService.requestPasswordReset(
      email.trim().toLowerCase()
    );

    return res.json({
      message:
        "If an account exists for this email, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req,
  res,
  next
) => {
  try {
    const { token } = req.params;
    const {
      password,
      confirmPassword,
    } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Reset token is required",
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        message:
          "Both password fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    await authService.resetPassword(
      token,
      password
    );

    return res.json({
      message:
        "Password reset successful. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req,
  res,
  next
) => {
  try {
    const { token } = req.params;

    const { alreadyVerified } = await authService.verifyEmail(token);

    return res.json({
      message: alreadyVerified
        ? "Your email was already verified"
        : "Email verified successfully",
      alreadyVerified,
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail = async (
  req,
  res,
  next
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    await authService.resendVerificationEmail(
      email.trim().toLowerCase()
    );

    return res.json({
      message:
        "If that account needs verification, an email has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (
  req,
  res
) => {
  res.clearCookie(
    "tenantcart_token",
    clearAuthCookieOptions
  );

  return res.json({
    message: "Logout successful",
  });
};