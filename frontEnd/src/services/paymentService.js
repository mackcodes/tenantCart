import api from "./api";

/**
 * Initiate a Razorpay payment for an existing pending order.
 * Returns { razorpayOrderId, amount, currency, keyId, orderId }
 */
export const initiatePayment = (
  orderId,
  paymentToken
) => {
  return api(`/payments/initiate/${orderId}`, {
    method: "POST",
    body: { paymentToken },
  });
};

/**
 * Verify the Razorpay payment after the modal succeeds.
 * Returns { message, order }
 */
export const verifyPayment = (payload) => {
  return api("/payments/verify", {
    method: "POST",
    body: payload,
  });
};

/**
 * Fetch the merchant's current Razorpay settings (keyId + onboarded status).
 * Never returns the keySecret.
 */
export const getPaymentSettings = () => {
  return api("/payments/settings");
};

/**
 * Save the merchant's Razorpay credentials.
 * Body: { keyId, keySecret }
 */
export const savePaymentSettings = (data) => {
  return api("/payments/settings", {
    method: "PUT",
    body: data,
  });
};
