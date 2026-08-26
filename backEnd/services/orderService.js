import Order from "../models/Order.js";

export const listByTenant = async (tenantId) => {
  return Order.find({
    tenant: tenantId,
  })
    .populate("customer", "name email")
    .populate("items.product", "name price")
    .sort({
      createdAt: -1,
    });
};

export const create = async (
  tenantId,
  customerId,
  { items, totalAmount }
) => {
  return Order.create({
    tenant: tenantId,
    customer: customerId,
    items,
    totalAmount,
  });
};

export const updateStatus = async (
  tenantId,
  orderId,
  status
) => {
  return Order.findOneAndUpdate(
    {
      _id: orderId,
      tenant: tenantId,
    },
    {
      status,
    },
    {
      new: true,
      runValidators: true,
    }
  );
};