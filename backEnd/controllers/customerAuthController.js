import * as customerAuthService from "../services/customerAuthService.js";
import { authRateLimit } from "../middlewares/authRateLimit.js";

const isProduction = process.env.NODE_ENV === "production";

const customerCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const clearCustomerCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

// POST /api/v1/storefront/:slug/auth/register
export const register = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const { customer, emailSent } = await customerAuthService.registerCustomer({
      slug,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    const token = customerAuthService.signCustomerToken(customer);
    res.cookie("tenantcart_customer_token", token, customerCookieOptions);

    return res.status(201).json({
      message: "Account created successfully",
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        emailVerified: customer.emailVerified,
      },
      emailSent,
      emailMessage: emailSent
        ? "Verification email sent"
        : "Account created, but the verification email could not be sent.",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/storefront/:slug/auth/login
export const login = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const { customer } = await customerAuthService.loginCustomer({
      slug,
      email: email.trim().toLowerCase(),
      password,
    });

    const token = customerAuthService.signCustomerToken(customer);
    res.cookie("tenantcart_customer_token", token, customerCookieOptions);

    return res.json({
      message: "Login successful",
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        emailVerified: customer.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/storefront/:slug/auth/logout
export const logout = (req, res) => {
  res.clearCookie("tenantcart_customer_token", clearCustomerCookieOptions);
  return res.json({ message: "Logout successful" });
};

// GET /api/v1/storefront/:slug/auth/me
export const getMe = async (req, res, next) => {
  try {
    // req.customer is attached by protectCustomer middleware.
    return res.json({
      customer: {
        id: req.customer._id,
        name: req.customer.name,
        email: req.customer.email,
        emailVerified: req.customer.emailVerified,
        phone: req.customer.phone,
        lastAddress: req.customer.lastAddress,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/storefront/:slug/auth/verify-email/:token
export const verifyEmail = async (req, res, next) => {
  try {
    const { slug, token } = req.params;

    const { alreadyVerified } = await customerAuthService.verifyCustomerEmail({
      slug,
      rawToken: token,
    });

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

// POST /api/v1/storefront/:slug/auth/resend-verification
export const resendVerification = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const { emailSent } = await customerAuthService.resendCustomerVerificationEmail({
      slug,
      email: email.trim().toLowerCase(),
    });

    return res.json({
      message: emailSent
        ? "Verification email sent. Check your inbox."
        : "That account is already verified or the verification email could not be sent.",
      emailSent,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/storefront/:slug/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    await customerAuthService.requestCustomerPasswordReset({
      slug,
      email: email.trim().toLowerCase(),
    });

    return res.json({
      message: "If an account exists for this email, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/storefront/:slug/auth/reset-password/:token
export const resetPassword = async (req, res, next) => {
  try {
    const { slug, token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "Both password fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    await customerAuthService.resetCustomerPassword({
      slug,
      rawToken: token,
      newPassword: password,
    });

    return res.json({
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};
