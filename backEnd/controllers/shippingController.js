import Tenant from "../models/Tenant.js";
import asyncHandler from "../utils/asyncHandler.js";
import { recordTenantAudit } from "../services/tenantAuditService.js";

export const getShippingSettings = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.tenantId).select("shipping").lean();

  return res.json({
    shipping: tenant?.shipping || {},
  });
});

export const updateShippingSettings = asyncHandler(async (req, res) => {
  const {
    flatRate,
    freeShippingThreshold,
    localPickupEnabled,
    estimatedDelivery,
  } = req.body;

  const parsedFlatRate = Number(flatRate);
  const parsedThreshold = Number(freeShippingThreshold);

  if (
    !Number.isFinite(parsedFlatRate) ||
    parsedFlatRate < 0 ||
    !Number.isFinite(parsedThreshold) ||
    parsedThreshold < 0
  ) {
    return res.status(400).json({
      message: "Shipping rates and thresholds must be zero or greater",
    });
  }

  if (!String(estimatedDelivery || "").trim()) {
    return res.status(400).json({
      message: "Estimated delivery is required",
    });
  }

  const tenant = await Tenant.findById(req.tenantId);

  if (!tenant) {
    return res.status(404).json({ message: "Store not found" });
  }

  tenant.shipping = {
    flatRate: parsedFlatRate,
    freeShippingThreshold: parsedThreshold,
    localPickupEnabled: Boolean(localPickupEnabled),
    estimatedDelivery: String(estimatedDelivery).trim(),
  };

  await tenant.save();

  await recordTenantAudit({
    tenantId: req.tenantId,
    actorId: req.user._id,
    action: "shipping.settings.updated",
    targetType: "shipping_settings",
    request: req,
  });

  return res.json({
    message: "Shipping settings saved successfully",
    shipping: tenant.shipping,
  });
});