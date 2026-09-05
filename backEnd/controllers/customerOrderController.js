import Order from "../models/Order.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * GET /api/v1/storefront/:slug/my-orders
 *
 * Returns orders linked to the authenticated customer.
 * Scoped to {tenant, customer._id} — the customer ObjectId ref — so a
 * customer at Store A can never retrieve orders from Store B even if they
 * share the same email address.
 */
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    tenant: req.storeTenantId,
    customer: req.customer._id,
  })
    .sort({ createdAt: -1 })
    .select("-checkoutTokenHash");

  return res.json({ orders });
});
