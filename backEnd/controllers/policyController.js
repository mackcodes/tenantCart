import Tenant from "../models/Tenant.js";
import asyncHandler from "../utils/asyncHandler.js";
import { recordTenantAudit } from "../services/tenantAuditService.js";

const policyFields = [
  "refundPolicy",
  "privacyPolicy",
  "termsOfService",
  "shippingPolicy",
  "cancellationPolicy",
];

export const getPolicies = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.tenantId).select("policies").lean();

  return res.json({ policies: tenant?.policies || {} });
});

export const updatePolicies = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.tenantId);

  if (!tenant) {
    return res.status(404).json({ message: "Store not found" });
  }

  const nextPolicies = { ...tenant.policies?.toObject?.() ?? tenant.policies };

  for (const field of policyFields) {
    if (req.body[field] !== undefined) {
      nextPolicies[field] = String(req.body[field]).trim().slice(0, 5000);
    }
  }

  tenant.policies = nextPolicies;
  await tenant.save();

  await recordTenantAudit({
    tenantId: req.tenantId,
    actorId: req.user._id,
    action: "policies.updated",
    targetType: "store_policies",
    request: req,
  });

  return res.json({
    message: "Store policies saved successfully",
    policies: tenant.policies,
  });
});
