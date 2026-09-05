import { Router } from "express";

import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from "../controllers/customerAuthController.js";

import { getMyOrders } from "../controllers/customerOrderController.js";

import {
  protectCustomer,
} from "../middlewares/customerAuthMiddleware.js";

import { authRateLimit } from "../middlewares/authRateLimit.js";

// Mounted at /api/v1/storefront/:slug
const router = Router({ mergeParams: true });

// ── Auth endpoints ──────────────────────────────────────────────────────────
router.post("/auth/register", authRateLimit, register);
router.post("/auth/login", authRateLimit, login);
router.post("/auth/logout", logout);

// Protected — requires a valid customer session for this store.
router.get("/auth/me", protectCustomer, getMe);

router.get("/auth/verify-email/:token", verifyEmail);
router.post("/auth/resend-verification", authRateLimit, resendVerification);
router.post("/auth/forgot-password", authRateLimit, forgotPassword);
router.post("/auth/reset-password/:token", authRateLimit, resetPassword);

// ── Customer order history ───────────────────────────────────────────────────
router.get("/my-orders", protectCustomer, getMyOrders);

export default router;
