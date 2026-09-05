import Order from "../models/Order.js";
import Tenant from "../models/Tenant.js";
import RazorpayWebhookEvent from "../models/RazorpayWebhookEvent.js";
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

const getProcessedRefundAmount = (order) =>
  (order.refunds || [])
    .filter((refund) => refund.status === "processed")
    .reduce((total, refund) => total + refund.amount, 0);

const syncRefundSummary = (order) => {
  const refundedAmount = getProcessedRefundAmount(order);
  order.refundedAmount = refundedAmount || null;
  if (refundedAmount >= order.totalAmount) {
    order.status = "refunded";
  } else if (order.status === "refunded") {
    order.status = "paid";
  }
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

  const keyId = tenant?.razorpay?.keyId;
  const keySecret = tenant?.razorpay?.keySecret;

  if (!keyId || !keySecret) {
    return res.status(400).json({
      message:
        "This store has not configured online payments yet. Please contact the store.",
    });
  }

  const amountInPaise = Math.round(order.totalAmount * 100);

  const razorpayOrder = await createRazorpayOrder(
    keyId,
    keySecret,
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

  const keySecret = tenant?.razorpay?.keySecret;

  if (!keySecret) {
    return res.status(400).json({
      message: "Unable to verify payment — store credentials not found",
    });
  }

  const isValid = verifyPaymentSignature(
    keySecret,
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
    webhookSecretSaved: Boolean(tenantDoc?.razorpay?.webhookSecret),
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
  const { keyId, keySecret, webhookSecret } = req.body;

  if (!keyId || !keySecret || !webhookSecret) {
    return res.status(400).json({
      message: "Key ID, Key Secret, and Webhook Secret are required",
    });
  }

  const tenantDoc = await Tenant.findById(req.tenantId);

  if (!tenantDoc) {
    return res.status(404).json({ message: "Store not found" });
  }

  tenantDoc.razorpay.keyId = keyId.trim();
  tenantDoc.razorpay.keySecret = keySecret.trim();
  tenantDoc.razorpay.webhookSecret = webhookSecret.trim();
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
 * Protected, merchant only — save a tenant's Razorpay Key ID and Key Secret.
 *
 * Body: { razorpayKeyId, razorpayKeySecret }
 *
 * Validates the format, optionally probes Razorpay to confirm the key is real,
 * then persists both credentials for that tenant.
 */
export const linkRazorpay = asyncHandler(async (req, res) => {
  const { razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret } = req.body;

  if (!razorpayKeyId || !razorpayKeySecret || !razorpayWebhookSecret) {
    return res.status(400).json({
      message: "Key ID, Key Secret, and Webhook Secret are required",
    });
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
  tenantDoc.razorpay.keySecret = razorpayKeySecret.trim();
  tenantDoc.razorpay.webhookSecret = razorpayWebhookSecret.trim();
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
  tenantDoc.razorpay.webhookSecret = null;
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

  // Parse the raw body to resolve the tenant whose webhook secret must be used.
  let event;

  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({ message: "Malformed webhook payload" });
  }

  const { event: eventName, payload } = event;
  const payment = payload?.payment?.entity;
  const refund = payload?.refund?.entity;
  const razorpayOrderId = payment?.order_id || payload?.order?.entity?.id;
  const paymentId = payment?.id || refund?.payment_id;
  const order = razorpayOrderId
    ? await Order.findOne({ razorpayOrderId }).populate("tenant")
    : paymentId
      ? await Order.findOne({ paymentRef: paymentId }).populate("tenant")
      : null;
  const webhookSecret = order?.tenant?.razorpay?.webhookSecret ||
    (process.env.NODE_ENV === "production"
      ? null
      : process.env.RAZORPAY_WEBHOOK_SECRET);

  let isValid;

  try {
    isValid = verifyWebhookSignature(req.body, signature, webhookSecret);
  } catch (configError) {
    console.error("Webhook config error:", configError.message);
    return res.status(500).json({ message: "Webhook not configured" });
  }

  if (!isValid) {
    console.warn(
      "Razorpay webhook: invalid signature — payload rejected",
      new Date().toISOString()
    );
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  const eventId = event.id || crypto
    .createHash("sha256")
    .update(req.body)
    .digest("hex");

  let eventRecord;
  try {
    eventRecord = await RazorpayWebhookEvent.create({ eventId, eventName });
  } catch (error) {
    if (error?.code === 11000) {
      // Razorpay retries the same event. It was already claimed or processed.
      return res.json({ received: true, duplicate: true });
    }
    throw error;
  }

  if (eventName === "payment.captured" || eventName === "order.paid") {
    if (payment?.order_id && payment.id) {
      if (order) {
        order.status = "paid";
        order.paymentRef = payment.id;
        await order.save();
      }
    }
  } else if (eventName === "payment.failed") {
    console.warn(
      "Razorpay payment.failed webhook received:",
      payment?.order_id,
      payment?.id,
      payment?.error_description
    );

    if (payment?.order_id) {
      // The order was resolved before signature verification.
    }
  } else if (
    eventName === "refund.created" ||
    eventName === "refund.processed" ||
    eventName === "refund.failed"
  ) {
    if (refund?.id && refund.payment_id) {
      if (order) {
        const amount = Number(refund.amount || 0) / 100;
        const existingRefund = order.refunds.find(
          (entry) => entry.refundId === refund.id
        );
        const nextStatus = eventName === "refund.failed"
          ? "failed"
          : eventName === "refund.processed"
            ? "processed"
            : "pending";

        if (existingRefund) {
          existingRefund.status = nextStatus;
          existingRefund.failureReason = refund.error_description || "";
          existingRefund.processedAt = nextStatus === "processed"
            ? new Date()
            : existingRefund.processedAt;
        } else {
          order.refunds.push({
            refundId: refund.id,
            amount,
            status: nextStatus,
            failureReason: refund.error_description || "",
            source: "webhook",
            processedAt: nextStatus === "processed" ? new Date() : null,
          });
        }

        syncRefundSummary(order);
        await order.save();
      }
    }
  }

  eventRecord.status = order ? "processed" : "ignored";
  eventRecord.order = order?._id || null;
  eventRecord.processedAt = new Date();
  await eventRecord.save();

  // Always acknowledge — Razorpay will retry on non-2xx responses.
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

  if (!order.paymentRef) {
    return res.status(400).json({
      message:
        "No Razorpay payment reference found on this order. Refund must be issued manually.",
    });
  }

  const refundableStatuses = ["paid", "shipped"];
  const processedAmount = getProcessedRefundAmount(order);
  const pendingAmount = (order.refunds || [])
    .filter((refund) => refund.status === "pending")
    .reduce((total, refund) => total + refund.amount, 0);

  const { amount: amountInRupees } = req.body;
  const requestedAmount = amountInRupees === undefined || amountInRupees === null
    ? order.totalAmount - processedAmount - pendingAmount
    : Number(amountInRupees);

  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    const existingRefund = order.refunds.find(
      (refund) => refund.status === "pending" || refund.status === "processed"
    );

    if (existingRefund) {
      return res.json({
        message: "Refund already requested",
        order: {
          id: order._id,
          status: order.status,
          refundId: existingRefund.refundId,
          refundedAmount: order.refundedAmount,
        },
      });
    }

    return res.status(400).json({ message: "No refundable amount remains" });
  }

  if (!refundableStatuses.includes(order.status)) {
    return res.status(400).json({
      message: `Only paid or shipped orders can be refunded (current status: ${order.status})`,
    });
  }

  if (requestedAmount > order.totalAmount - processedAmount - pendingAmount) {
    return res.status(400).json({
      message: `Refund amount (₹${requestedAmount}) exceeds the remaining refundable amount`,
    });
  }

  const amountInPaise = Math.round(requestedAmount * 100);
  const duplicateRefund = order.refunds.find(
    (refund) => refund.amount === requestedAmount &&
      ["pending", "processed"].includes(refund.status)
  );

  if (duplicateRefund) {
    return res.json({
      message: "Refund already requested",
      order: {
        id: order._id,
        status: order.status,
        refundId: duplicateRefund.refundId,
        refundedAmount: order.refundedAmount,
      },
    });
  }

  const tenant = await Tenant.findById(tenantId).select("razorpay");

  if (!tenant?.razorpay?.keyId || !tenant?.razorpay?.keySecret) {
    return res.status(400).json({
      message: "Store payment credentials are not configured",
    });
  }

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
  const refundStatus = razorpayRefund.status === "processed"
    ? "processed"
    : "pending";

  order.refunds.push({
    refundId: razorpayRefund.id,
    amount: refundedRupees,
    status: refundStatus,
    source: "merchant",
    processedAt: refundStatus === "processed" ? new Date() : null,
  });
  order.refundId = razorpayRefund.id;
  syncRefundSummary(order);
  await order.save();

  await recordTenantAudit({
    tenantId,
    actorId: req.user._id,
    action: refundStatus === "processed" ? "order.refunded" : "order.refund_requested",
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
