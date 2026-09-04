import Order from "../models/Order.js";
import Tenant from "../models/Tenant.js";
import crypto from "node:crypto";
import asyncHandler from "../utils/asyncHandler.js";
import { recordTenantAudit } from "../services/tenantAuditService.js";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
} from "../services/razorpayService.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

const hashCheckoutToken = (token) => crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");

const hasValidCheckoutToken = (order, token) => {
  if (!token || !order.checkoutTokenHash) {
    return false;
  }

  const expected = Buffer.from(order.checkoutTokenHash, "hex");
  const received = Buffer.from(hashCheckoutToken(token), "hex");

  return expected.length === received.length &&
    crypto.timingSafeEqual(expected, received);
};

const requireCheckoutToken = (order, token, res) => {
  if (hasValidCheckoutToken(order, token)) {
    return true;
  }

  res.status(403).json({
    message: "A valid checkout payment token is required",
  });
  return false;
};

// ─── Payment Initiation ──────────────────────────────────────────────────────

/**
 * POST /api/v1/payments/initiate/:orderId
 * Public — called right after the checkout order is created.
 * Creates a Razorpay order using the tenant's saved credentials.
 */
export const initiatePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { paymentToken } = req.body;

  // Fetch the pending order
  const order = await Order.findById(orderId)
    .select("+checkoutTokenHash")
    .populate("tenant");

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (!requireCheckoutToken(order, paymentToken, res)) {
    return;
  }

  if (order.status !== "pending") {
    return res.status(400).json({
      message: "Payment can only be initiated for pending orders",
    });
  }

  // Fetch tenant Razorpay credentials
  const tenant = await Tenant.findById(order.tenant);

  if (!tenant?.razorpay?.keyId || !tenant?.razorpay?.keySecret) {
    return res.status(400).json({
      message:
        "This store has not configured online payments yet. Please contact the store.",
    });
  }

  const amountInPaise = Math.round(order.totalAmount * 100);

  const razorpayOrder = await createRazorpayOrder(
    tenant.razorpay.keyId,
    tenant.razorpay.keySecret,
    amountInPaise,
    "INR",
    order._id.toString()
  );

  // Persist the Razorpay order ID so we can verify it later
  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  return res.json({
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: tenant.razorpay.keyId,
    orderId: order._id,
  });
});

// ─── Payment Verification ────────────────────────────────────────────────────

/**
 * POST /api/v1/payments/verify
 * Public — called after Razorpay modal reports a successful payment.
 * Verifies the HMAC signature, then marks the order as paid.
 *
 * Body: { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paymentToken,
  } = req.body;

  if (
    !orderId ||
    !razorpayOrderId ||
    !razorpayPaymentId ||
    !razorpaySignature
  ) {
    return res.status(400).json({
      message:
        "orderId, razorpayOrderId, razorpayPaymentId, and razorpaySignature are all required",
    });
  }

  const order = await Order.findById(orderId)
    .select("+checkoutTokenHash")
    .populate("tenant");

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (!requireCheckoutToken(order, paymentToken, res)) {
    return;
  }

  if (order.razorpayOrderId !== razorpayOrderId) {
    return res.status(400).json({
      message: "Razorpay order ID mismatch",
    });
  }

  if (order.status === "paid") {
    return res.json({
      message: "Order is already paid",
      order: {
        id: order._id,
        status: order.status,
      },
    });
  }

  // Fetch key secret to verify signature
  const tenant = await Tenant.findById(order.tenant);

  if (!tenant?.razorpay?.keySecret) {
    return res.status(400).json({
      message: "Unable to verify payment — store credentials not found",
    });
  }

  const isValid = verifyPaymentSignature(
    tenant.razorpay.keySecret,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid) {
    return res.status(400).json({
      message: "Payment signature verification failed. Please contact support.",
    });
  }

  // Mark as paid
  order.status = "paid";
  order.paymentRef = razorpayPaymentId;
  await order.save();

  return res.json({
    message: "Payment verified successfully",
    order: {
      id: order._id,
      status: order.status,
    },
  });
});

// ─── Payment Settings (merchant dashboard) ───────────────────────────────────

/**
 * GET /api/v1/payments/settings
 * Protected, merchant only — returns current Razorpay keyId and onboarded status.
 * Never returns the keySecret.
 */
export const getPaymentSettings = asyncHandler(async (req, res) => {
  const tenantDoc = await Tenant.findById(req.tenantId).select("razorpay");

  return res.json({
    keyId: tenantDoc?.razorpay?.keyId || "",
    keySecretSaved: Boolean(tenantDoc?.razorpay?.keySecret),
    onboarded: tenantDoc?.razorpay?.onboarded || false,
  });
});

/**
 * PUT /api/v1/payments/settings
 * Protected, merchant only — saves Razorpay keyId and keySecret.
 *
 * Body: { keyId, keySecret }
 */
export const savePaymentSettings = asyncHandler(async (req, res) => {
  const { keyId, keySecret } = req.body;

  if (!keyId || !keySecret) {
    return res.status(400).json({
      message: "Both Key ID and Key Secret are required",
    });
  }

  const tenantDoc = await Tenant.findById(req.tenantId);

  if (!tenantDoc) {
    return res.status(404).json({ message: "Store not found" });
  }

  tenantDoc.razorpay.keyId = keyId.trim();
  tenantDoc.razorpay.keySecret = keySecret.trim();
  tenantDoc.razorpay.onboarded = true;

  // Mark paymentOnboardingComplete in the verification checks
  if (tenantDoc.verification?.checks) {
    tenantDoc.verification.checks.paymentOnboardingComplete = true;
  }

  await tenantDoc.save();

  await recordTenantAudit({
    tenantId: req.tenantId,
    actorId: req.user._id,
    action: "payment.settings.updated",
    targetType: "payment_settings",
    request: req,
  });

  return res.json({
    message: "Payment settings saved successfully",
    keyId: tenantDoc.razorpay.keyId,
    onboarded: true,
  });
});
