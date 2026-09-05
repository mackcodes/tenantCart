import Discount from "../models/Discount.js";
import Tenant from "../models/Tenant.js";
import asyncHandler from "../utils/asyncHandler.js";
import { recordTenantAudit } from "../services/tenantAuditService.js";
import { resolveDiscount } from "../services/discountService.js";

const validTypes = ["percentage", "fixed"];

const parseDiscountInput = (body) => {
  const code = String(body.code || "").trim().toUpperCase();
  const type = body.type;
  const value = Number(body.value);
  const minOrderAmount = Number(body.minOrderAmount ?? 0);
  const maxUses = body.maxUses === null || body.maxUses === undefined || body.maxUses === ""
    ? null
    : Number(body.maxUses);
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  if (!code) {
    throw Object.assign(new Error("A discount code is required"), { statusCode: 400 });
  }

  if (!validTypes.includes(type)) {
    throw Object.assign(new Error("Discount type must be percentage or fixed"), { statusCode: 400 });
  }

  if (!Number.isFinite(value) || value <= 0) {
    throw Object.assign(new Error("A valid discount value is required"), { statusCode: 400 });
  }

  if (type === "percentage" && value > 100) {
    throw Object.assign(new Error("Percentage discounts cannot exceed 100"), { statusCode: 400 });
  }

  if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
    throw Object.assign(new Error("Minimum order amount must be zero or greater"), { statusCode: 400 });
  }

  if (maxUses !== null && (!Number.isFinite(maxUses) || maxUses < 1)) {
    throw Object.assign(new Error("Max uses must be a positive number"), { statusCode: 400 });
  }

  return {
    code,
    type,
    value,
    minOrderAmount,
    maxUses,
    expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
    active: body.active === undefined ? true : Boolean(body.active),
  };
};

export const listDiscounts = asyncHandler(async (req, res) => {
  const discounts = await Discount.find({ tenant: req.tenantId }).sort({ createdAt: -1 });

  return res.json({ discounts });
});

export const createDiscount = asyncHandler(async (req, res) => {
  const parsed = parseDiscountInput(req.body);

  const existing = await Discount.findOne({ tenant: req.tenantId, code: parsed.code });

  if (existing) {
    return res.status(409).json({ message: "A discount with this code already exists" });
  }

  const discount = await Discount.create({ tenant: req.tenantId, ...parsed });

  await recordTenantAudit({
    tenantId: req.tenantId,
    actorId: req.user._id,
    action: "discount.created",
    targetType: "discount",
    targetId: discount._id,
    metadata: { code: discount.code },
    request: req,
  });

  return res.status(201).json({ message: "Discount created", discount });
});

export const updateDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.findOne({ _id: req.params.id, tenant: req.tenantId });

  if (!discount) {
    return res.status(404).json({ message: "Discount not found" });
  }

  const parsed = parseDiscountInput({ ...discount.toObject(), ...req.body });

  if (parsed.code !== discount.code) {
    const existing = await Discount.findOne({
      tenant: req.tenantId,
      code: parsed.code,
      _id: { $ne: discount._id },
    });

    if (existing) {
      return res.status(409).json({ message: "A discount with this code already exists" });
    }
  }

  Object.assign(discount, parsed);
  await discount.save();

  await recordTenantAudit({
    tenantId: req.tenantId,
    actorId: req.user._id,
    action: "discount.updated",
    targetType: "discount",
    targetId: discount._id,
    metadata: { code: discount.code, active: discount.active },
    request: req,
  });

  return res.json({ message: "Discount updated", discount });
});

export const deleteDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.findOneAndDelete({ _id: req.params.id, tenant: req.tenantId });

  if (!discount) {
    return res.status(404).json({ message: "Discount not found" });
  }

  await recordTenantAudit({
    tenantId: req.tenantId,
    actorId: req.user._id,
    action: "discount.deleted",
    targetType: "discount",
    targetId: discount._id,
    metadata: { code: discount.code },
    request: req,
  });

  return res.json({ message: "Discount deleted" });
});

export const validateDiscountPublic = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { code, subtotal } = req.body;

  const tenant = await Tenant.findOne({
    slug: String(slug || "").trim().toLowerCase(),
    status: "approved",
  }).select("_id");

  if (!tenant) {
    return res.status(404).json({ message: "Store not found" });
  }

  const parsedSubtotal = Number(subtotal);

  if (!Number.isFinite(parsedSubtotal) || parsedSubtotal < 0) {
    return res.status(400).json({ message: "A valid subtotal is required" });
  }

  const result = await resolveDiscount({
    tenantId: tenant._id,
    code,
    subtotal: parsedSubtotal,
  });

  return res.json({
    code: result.discount.code,
    discountAmount: result.discountAmount,
  });
});
