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

/**
 * Guided onboarding — link tenant-specific Razorpay credentials.
 * The backend validates the Key ID before saving both credentials.
 * Body: { razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret }
 * Returns { message, keyId, onboarded, onboardedAt }
 */
export const linkRazorpay = (
  razorpayKeyId,
  razorpayKeySecret,
  razorpayWebhookSecret
) => {
  return api("/payments/onboarding/link", {
    method: "POST",
    body: { razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret },
  });
};

/**
 * Guided onboarding — disconnect Razorpay from this store.
 * Returns { message }
 */
export const disconnectRazorpay = () => {
  return api("/payments/onboarding/link", {
    method: "DELETE",
  });
};
