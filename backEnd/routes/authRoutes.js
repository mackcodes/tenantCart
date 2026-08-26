import { Router } from "express";

import {
  registerAccount,
  registerStore,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/authController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { authRateLimit } from "../middlewares/authRateLimit.js";

const router = Router();

router.post(
  "/register-account",
  registerAccount
);

router.post(
  "/register-store",
  protect,
  registerStore
);

router.post(
  "/login",
  authRateLimit,
  login
);

router.post("/logout", logout);

router.get(
  "/me",
  protect,
  getMe
);

router.post(
  "/forgot-password",
  authRateLimit,
  forgotPassword
);

router.post(
  "/reset-password/:token",
  authRateLimit,
  resetPassword
);

router.get(
  "/verify-email/:token",
  verifyEmail
);

router.post(
  "/resend-verification",
  authRateLimit,
  resendVerificationEmail
);

export default router;