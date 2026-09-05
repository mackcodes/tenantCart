import express from "express";

import {
  initiatePayment,
  verifyPayment,
  getPaymentSettings,
  savePaymentSettings,
  handleRazorpayWebhook,
} from "../controllers/paymentController.js";

import { protect } from "../middlewares/authMiddleware.js";
import {
  requireTenant,
  requireTenantRole,
} from "../middlewares/tenantMiddleware.js";
import validateObjectId from "../middlewares/validateObjectId.js";

const router = express.Router();

// ── Razorpay webhook ──────────────────────────────────────────────────────────
// MUST be mounted before any express.json() middleware so the body arrives as
// a raw Buffer that can be used for HMAC signature verification.
router.post(
  "/razorpay/webhook",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook
);

// Public — called by storefront checkout flow
router.post("/initiate/:orderId", validateObjectId("orderId"), initiatePayment);
router.post("/verify", verifyPayment);

// Merchant-only — payment settings in dashboard
router.get(
  "/settings",
  protect,
  requireTenant,
  requireTenantRole("owner", "admin"),
  getPaymentSettings
);
router.put(
  "/settings",
  protect,
  requireTenant,
  requireTenantRole("owner", "admin"),
  savePaymentSettings
);

export default router;
