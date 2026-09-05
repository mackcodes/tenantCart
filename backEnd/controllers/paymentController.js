import Order from "../models/Order.js";
import Tenant from "../models/Tenant.js";
import crypto from "node:crypto";
import asyncHandler from "../utils/asyncHandler.js";
import { recordTenantAudit } from "../services/tenantAuditService.js";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  issueRefund,
  verifyRazorpayKeyId,
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
    onboardedAt: tenantDoc?.razorpay?.onboardedAt || null,
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

// ─── Guided Merchant Onboarding ──────────────────────────────────────────────

/**
 * POST /api/v1/payments/onboarding/link
 * Protected, merchant only — save only a Razorpay Key ID (no secret required).
 *
 * Body: { razorpayKeyId }
 *
 * Validates the format, optionally probes Razorpay to confirm the key is real,
 * then persists it.  The merchant never touches webhooks or secrets.
 */
export const linkRazorpay = asyncHandler(async (req, res) => {
  const { razorpayKeyId } = req.body;

  if (!razorpayKeyId) {
    return res.status(400).json({ message: "razorpayKeyId is required" });
  }

  const trimmed = razorpayKeyId.trim();

  // Basic format check — must start with rzp_test_ or rzp_live_
  if (!/^rzp_(test|live)_[a-zA-Z0-9]{5,}$/.test(trimmed)) {
    return res.status(400).json({
      message:
        "Invalid Key ID format. It should look like rzp_test_xxxxx or rzp_live_xxxxx.",
    });
  }

  // Verify the key is recognised by Razorpay before persisting
  const isValid = await verifyRazorpayKeyId(trimmed);

  if (!isValid) {
    return res.status(400).json({
      message:
        "We could not verify this Key ID with Razorpay. Please check it and try again.",
    });
  }

  const tenantDoc = await Tenant.findById(req.tenantId);

  if (!tenantDoc) {
    return res.status(404).json({ message: "Store not found" });
  }

  tenantDoc.razorpay.keyId = trimmed;
  tenantDoc.razorpay.onboarded = true;
  tenantDoc.razorpay.onboardedAt = new Date();

  if (tenantDoc.verification?.checks) {
    tenantDoc.verification.checks.paymentOnboardingComplete = true;
  }

  await tenantDoc.save();

  await recordTenantAudit({
    tenantId: req.tenantId,
    actorId: req.user._id,
    action: "payment.onboarding.linked",
    targetType: "payment_settings",
    request: req,
  });

  return res.json({
    message: "Razorpay connected successfully.",
    keyId: tenantDoc.razorpay.keyId,
    onboarded: true,
    onboardedAt: tenantDoc.razorpay.onboardedAt,
  });
});

/**
 * DELETE /api/v1/payments/onboarding/link
 * Protected, merchant only — disconnect Razorpay from this store.
 *
 * Clears keyId, keySecret, onboarded, and onboardedAt.
 * The merchant can re-connect at any time via POST /onboarding/link.
 */
export const disconnectRazorpay = asyncHandler(async (req, res) => {
  const tenantDoc = await Tenant.findById(req.tenantId);

  if (!tenantDoc) {
    return res.status(404).json({ message: "Store not found" });
  }

  tenantDoc.razorpay.keyId = null;
  tenantDoc.razorpay.keySecret = null;
  tenantDoc.razorpay.onboarded = false;
  tenantDoc.razorpay.onboardedAt = null;

  if (tenantDoc.verification?.checks) {
    tenantDoc.verification.checks.paymentOnboardingComplete = false;
  }

  await tenantDoc.save();

  await recordTenantAudit({
    tenantId: req.tenantId,
    actorId: req.user._id,
    action: "payment.onboarding.disconnected",
    targetType: "payment_settings",
    request: req,
  });

  return res.json({ message: "Razorpay disconnected successfully." });
});



/**
 * POST /api/v1/payments/razorpay/webhook
 * Public — called by Razorpay's servers for asynchronous payment events.
 *
 * This endpoint MUST receive the raw (un-parsed) request body so the HMAC
 * digest can be computed over the exact bytes Razorpay signed.  The route is
 * mounted before the global express.json() middleware in app.js.
 *
 * Handles:
 *   payment.captured  → marks order paid (idempotent)
 *   order.paid        → alias for the above (some Razorpay plans emit this)
 *   payment.failed    → leaves the order pending so the customer can retry
 */
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  if (!signature) {
    return res.status(400).json({ message: "Missing webhook signature" });
  }

  // req.body is a Buffer when the route uses express.raw()
  let isValid;

  try {
    isValid = verifyWebhookSignature(req.body, signature);
  } catch (configError) {
    console.error("Webhook config error:", configError.message);
    return res.status(500).json({ message: "Webhook not configured" });
  }

  if (!isValid) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  // Parse the raw body now that signature is confirmed
  let event;

  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({ message: "Malformed webhook payload" });
  }

  const { event: eventName, payload } = event;

  if (eventName === "payment.captured" || eventName === "order.paid") {
    // Razorpay puts the payment entity inside payload.payment.entity
    const payment = payload?.payment?.entity;

    if (!payment) {
      // Unexpected payload shape — acknowledge so Razorpay doesn't retry
      return res.json({ received: true });
    }

    const razorpayOrderId = payment.order_id;
    const paymentId = payment.id;

    if (!razorpayOrderId || !paymentId) {
      return res.json({ received: true });
    }

    const order = await Order.findOne({ razorpayOrderId });

    if (!order) {
      // Not our order (multi-merchant edge case or test event) — acknowledge
      return res.json({ received: true });
    }

    // Idempotency guard — do nothing if already paid
    if (order.status !== "paid") {
      order.status = "paid";
      order.paymentRef = paymentId;
      await order.save();
    }
  } else if (eventName === "payment.failed") {
    // We intentionally leave the order as "pending" so the customer can retry.
    // Log for observability only.
    const payment = payload?.payment?.entity;
    console.warn(
      "Razorpay payment.failed webhook received:",
      payment?.order_id,
      payment?.id,
      payment?.error_description
    );
  }

  // Always acknowledge — Razorpay will retry on non-2xx responses
  return res.json({ received: true });
});

// ─── Merchant Refund ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/orders/:id/refund
 * Protected, merchant only (owner or admin).
 *
 * Body (optional):
 *   { amount: <number in rupees> }   — omit for a full refund
 *
 * Validates:
 *   - order belongs to the authenticated tenant
 *   - order is in "paid" or "shipped" status (delivered orders cannot be
 *     auto-refunded without manual review)
 *   - tenant has valid Razorpay credentials
 *   - a paymentRef (Razorpay payment ID) is recorded on the order
 */
export const refundOrder = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id: orderId } = req.params;

  const order = await Order.findOne({ _id: orderId, tenant: tenantId });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const refundableStatuses = ["paid", "shipped"];

  if (!refundableStatuses.includes(order.status)) {
    return res.status(400).json({
      message: `Only paid or shipped orders can be refunded (current status: ${order.status})`,
    });
  }

  if (!order.paymentRef) {
    return res.status(400).json({
      message:
        "No Razorpay payment reference found on this order. Refund must be issued manually.",
    });
  }

  const tenant = await Tenant.findById(tenantId).select("razorpay");

  if (!tenant?.razorpay?.keyId || !tenant?.razorpay?.keySecret) {
    return res.status(400).json({
      message: "Store payment credentials are not configured",
    });
  }

  const { amount: amountInRupees } = req.body;

  let amountInPaise;

  if (amountInRupees !== undefined && amountInRupees !== null) {
    const parsed = Number(amountInRupees);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return res.status(400).json({
        message: "amount must be a positive number (in rupees)",
      });
    }

    if (parsed > order.totalAmount) {
      return res.status(400).json({
        message: `Refund amount (₹${parsed}) cannot exceed order total (₹${order.totalAmount})`,
      });
    }

    amountInPaise = Math.round(parsed * 100);
  }
  // If amountInRupees is omitted, amountInPaise stays undefined → full refund

  let razorpayRefund;

  try {
    razorpayRefund = await issueRefund(
      tenant.razorpay.keyId,
      tenant.razorpay.keySecret,
      order.paymentRef,
      amountInPaise
    );
  } catch (razorpayError) {
    console.error("Razorpay refund error:", razorpayError);
    return res.status(502).json({
      message:
        razorpayError?.error?.description ||
        "Razorpay refund request failed. Please try again or issue the refund from the Razorpay dashboard.",
    });
  }

  const refundedRupees = razorpayRefund.amount / 100;

  order.status = "refunded";
  order.refundId = razorpayRefund.id;
  order.refundedAmount = refundedRupees;
  await order.save();

  await recordTenantAudit({
    tenantId,
    actorId: req.user._id,
    action: "order.refunded",
    targetType: "order",
    targetId: order._id,
    metadata: {
      refundId: razorpayRefund.id,
      refundedAmount: refundedRupees,
    },
    request: req,
  });

  return res.json({
    message: "Refund issued successfully",
    order: {
      id: order._id,
      status: order.status,
      refundId: order.refundId,
      refundedAmount: order.refundedAmount,
    },
  });
});
