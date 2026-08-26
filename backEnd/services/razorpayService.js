// Razorpay Route (split payments) — NOT YET IMPLEMENTED (stub)
// Route lets platform create a Linked Account per tenant, then split each order
// payment between platform commission and merchant payout at capture time.
// Docs: Linked Accounts -> Orders with transfers[] -> Route settlement.

// import Razorpay from "razorpay";
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

export const createLinkedAccount = async (tenant) => {
  throw new Error("razorpayService.createLinkedAccount not implemented yet");
};

export const createSplitOrder = async ({ amount, tenantAccountId, platformFee }) => {
  throw new Error("razorpayService.createSplitOrder not implemented yet");
};

export const verifyWebhookSignature = (rawBody, signature) => {
  throw new Error("razorpayService.verifyWebhookSignature not implemented yet");
};