import api from "./api.js";

export const getDiscounts = () => api("/discounts");

export const createDiscount = (discount) =>
  api("/discounts", {
    method: "POST",
    body: discount,
  });

export const updateDiscount = (discountId, updates) =>
  api(`/discounts/${discountId}`, {
    method: "PATCH",
    body: updates,
  });

export const deleteDiscount = (discountId) =>
  api(`/discounts/${discountId}`, {
    method: "DELETE",
  });

export const validateDiscountCode = (slug, code, subtotal) =>
  api(`/discounts/validate/${slug}`, {
    method: "POST",
    body: { code, subtotal },
  });
