import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Tenant from "../models/Tenant.js";
import crypto from "node:crypto";
import asyncHandler from "../utils/asyncHandler.js";
import { recordTenantAudit } from "../services/tenantAuditService.js";

const normalizeSlug = (value) => value?.trim().toLowerCase();

const createCheckoutToken = () => crypto
  .randomBytes(32)
  .toString("hex");

const hashCheckoutToken = (token) => crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");

export const createOrder = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const tenant = await Tenant.findOne({
    slug: normalizeSlug(slug),
    status: "approved",
  }).select("_id storeName slug");

  if (!tenant) {
    return res.status(404).json({
      message: "Store not found or not approved",
    });
  }

  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    items,
  } = req.body;

  if (!customerName || !customerEmail) {
    return res.status(400).json({
      message: "Customer name and email are required",
    });
  }

  if (
    !shippingAddress?.line1 ||
    !shippingAddress?.city ||
    !shippingAddress?.state ||
    !shippingAddress?.postalCode
  ) {
    return res.status(400).json({
      message: "Complete shipping address is required",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Order must contain at least one item",
    });
  }

  const orderItems = [];
  let totalAmount = 0;

  for (const requestedItem of items) {
    const { productId, quantity } = requestedItem;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        message: "Each item requires a valid productId and quantity",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      tenantId: tenant._id,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        message: `Product not found: ${productId}`,
      });
    }

    if (product.stock < quantity) {
      return res.status(409).json({
        message: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
      });
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity,
    });

    totalAmount += product.price * quantity;
  }

  const stockUpdates = [];

  try {
    for (const item of orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product,
          tenantId: tenant._id,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        throw Object.assign(
          new Error(`Stock became unavailable for "${item.name}"`),
          { statusCode: 409 }
        );
      }

      stockUpdates.push({ productId: item.product, quantity: item.quantity });
    }
  } catch (stockError) {
    for (const update of stockUpdates) {
      await Product.updateOne(
        { _id: update.productId },
        { $inc: { stock: update.quantity } }
      );
    }

    return res.status(stockError.statusCode || 409).json({
      message: stockError.message || "Unable to reserve stock",
    });
  }

  const paymentToken = createCheckoutToken();

  const order = await Order.create({
    tenant: tenant._id,
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim().toLowerCase(),
    customerPhone: customerPhone?.trim() || "",
    shippingAddress: {
      line1: shippingAddress.line1.trim(),
      line2: shippingAddress.line2?.trim() || "",
      city: shippingAddress.city.trim(),
      state: shippingAddress.state.trim(),
      postalCode: shippingAddress.postalCode.trim(),
      country: shippingAddress.country?.trim() || "India",
    },
    items: orderItems,
    totalAmount,
    status: "pending",
    checkoutTokenHash: hashCheckoutToken(paymentToken),
  });

  const orderResponse = order.toObject();
  delete orderResponse.checkoutTokenHash;

  return res.status(201).json({
    message: "Order placed successfully",
    order: orderResponse,
    // This one-time capability is required to begin or verify payment for
    // this guest checkout. The database only stores its hash.
    paymentToken,
  });
});

export const getMerchantOrders = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;

  if (!tenantId) {
    return res.status(400).json({
      message: "Create a store before viewing orders",
    });
  }

  const { status } = req.query;
  const filter = { tenant: tenantId };

  if (status) {
    filter.status = status;
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });

  return res.json({ orders });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;

  const order = await Order.findOne({
    _id: req.params.id,
    tenant: tenantId,
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.json({ order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;

  const { status } = req.body;

  const allowedStatuses = [
    "pending",
    "paid",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }

  const order = await Order.findOne({
    _id: req.params.id,
    tenant: tenantId,
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (status === "cancelled" && order.status !== "cancelled") {
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } }
      );
    }
  }

  if (status) {
    order.status = status;
  }

  await order.save();

  await recordTenantAudit({
    tenantId,
    actorId: req.user._id,
    action: "order.status.updated",
    targetType: "order",
    targetId: order._id,
    metadata: { status: order.status },
    request: req,
  });

  return res.json({
    message: "Order updated successfully",
    order,
  });
});
