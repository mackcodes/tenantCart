import api from "./api";

export const getMerchantOrders = (status) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";

  return api(`/orders${query}`);
};

export const getOrderById = (orderId) => {
  return api(`/orders/${orderId}`);
};

export const updateOrderStatus = (orderId, status) => {
  return api(`/orders/${orderId}`, {
    method: "PATCH",
    body: { status },
  });
};

export const checkout = (slug, orderData) => {
  return api(`/orders/checkout/${slug}`, {
    method: "POST",
    body: orderData,
  });
};

/**
 * Issue a full or partial refund for an order.
 * @param {string} orderId     - The order's MongoDB _id
 * @param {number} [amount]    - Amount in rupees; omit for a full refund
 */
export const refundOrder = (orderId, amount) => {
  return api(`/orders/${orderId}/refund`, {
    method: "POST",
    body: amount !== undefined ? { amount } : {},
  });
};
