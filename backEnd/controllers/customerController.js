import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listCustomers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { tenant: req.tenantId };

  if (search) {
    const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, "i");
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const customers = await Customer.find(filter).sort({ lastOrderAt: -1 });

  return res.json({ customers });
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({
    _id: req.params.id,
    tenant: req.tenantId,
  });

  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  const orders = await Order.find({
    tenant: req.tenantId,
    customerEmail: customer.email,
  }).sort({ createdAt: -1 });

  return res.json({ customer, orders });
});
