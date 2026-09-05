import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Build a one-off Razorpay client for a given merchant's credentials.
 */
const buildClient = (keyId, keySecret) =>
  new Razorpay({ key_id: keyId, key_secret: keySecret });

/**
 * Create a Razorpay order.
 * @param {string} keyId         - Merchant's Razorpay Key ID
 * @param {string} keySecret     - Merchant's Razorpay Key Secret
 * @param {number} amountInPaise - Total in paise (amount × 100)
 * @param {string} currency      - e.g. "INR"
 * @param {string} receipt       - Unique receipt id (your internal Order._id)
 * @returns {Promise<object>}    - Razorpay order object
 */
export const createRazorpayOrder = async (
  keyId,
  keySecret,
  amountInPaise,
  currency = "INR",
  receipt
) => {
  const client = buildClient(keyId, keySecret);

  return client.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    payment_capture: 1,
  });
};

/**
 * Verify the HMAC-SHA256 signature that Razorpay sends back after a payment.
 * @param {string} keySecret       - Merchant's Razorpay Key Secret
 * @param {string} razorpayOrderId - The order id returned by Razorpay
 * @param {string} paymentId       - razorpay_payment_id from the callback
 * @param {string} signature       - razorpay_signature from the callback
 * @returns {boolean}
 */
export const verifyPaymentSignature = (
  keySecret,
  razorpayOrderId,
  paymentId,
  signature
) => {
  const body = `${razorpayOrderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
};

/**
 * Verify the HMAC-SHA256 signature on an inbound Razorpay webhook request.
 * Uses the platform-level webhook secret (RAZORPAY_WEBHOOK_SECRET), not a
 * per-merchant key, because Razorpay sends webhooks from its own servers.
 *
 * @param {Buffer|string} rawBody   - The raw request body (must not be JSON-parsed first)
 * @param {string}        signature - Value of the X-Razorpay-Signature header
 * @returns {boolean}
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
};

/**
 * Issue a refund for a captured Razorpay payment using the merchant's credentials.
 *
 * @param {string} keyId          - Merchant's Razorpay Key ID
 * @param {string} keySecret      - Merchant's Razorpay Key Secret
 * @param {string} paymentId      - razorpay_payment_id to refund
 * @param {number} [amountInPaise] - Amount to refund in paise; omit for full refund
 * @returns {Promise<object>}     - Razorpay refund object
 */
export const issueRefund = async (
  keyId,
  keySecret,
  paymentId,
  amountInPaise
) => {
  const client = buildClient(keyId, keySecret);

  const options = {};

  if (amountInPaise !== undefined && amountInPaise !== null) {
    options.amount = amountInPaise;
  }

  return client.payments.refund(paymentId, options);
};