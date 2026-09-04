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