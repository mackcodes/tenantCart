import mongoose from "mongoose";
import Tenant from "../models/Tenant.js";

const isValidEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const hasText = (value) =>
  typeof value === "string" && value.trim().length > 0;

const getRequiredFieldsState = (tenant) => {
  const address = tenant.address || {};

  return [
    hasText(tenant.storeName),
    hasText(tenant.slug),
    hasText(tenant.category),
    hasText(address.line1),
    hasText(address.city),
    hasText(address.state),
    hasText(address.postalCode),
  ].every(Boolean);
};

const getSlugAvailableState = async (tenant) => {
  if (!hasText(tenant.slug)) {
    return false;
  }

  const conflictingTenant = await Tenant.findOne({
    _id: { $ne: tenant._id },
    slug: tenant.slug,
  }).select("_id");

  return !conflictingTenant;
};

export const evaluateTenant = async (tenantId) => {
  if (!mongoose.isValidObjectId(tenantId)) {
    const error = new Error("Invalid tenant ID");
    error.statusCode = 400;
    throw error;
  }

  const tenant = await Tenant.findById(tenantId);

  if (!tenant) {
    const error = new Error("Tenant not found");
    error.statusCode = 404;
    throw error;
  }

  const checks = {
    emailVerified: tenant.emailVerified === true,
    requiredFieldsComplete: getRequiredFieldsState(tenant),
    slugAvailable: await getSlugAvailableState(tenant),
  };

  const failedChecks = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  // Phone verification and payment onboarding are not implemented yet, so
  // they're intentionally excluded from automated approval requirements.
  const requiredChecks = [
    "emailVerified",
    "requiredFieldsComplete",
    "slugAvailable",
  ];

  const passedRequiredChecks = requiredChecks.filter(
    (name) => checks[name]
  ).length;

  const score = Math.round(
    (passedRequiredChecks / requiredChecks.length) * 100
  );

  const riskLevel =
    failedChecks.length === 0
      ? "low"
      : score >= 60
        ? "medium"
        : "high";

  let status = "pending_verification";

  if (riskLevel === "high") {
    status = "pending_review";
  } else if (failedChecks.length === 0) {
    status = "approved";
  } else if (riskLevel === "medium") {
    status = "pending_review";
  }

  // Once an admin has manually reviewed a tenant, automated re-evaluation
  // should only refresh the score/checks, not silently override their decision.
  const hasManualReview = Boolean(tenant.verification?.reviewedBy);

  if (!hasManualReview) {
    tenant.status = status;
  }

  tenant.verification = {
    ...(tenant.verification?.toObject?.() || tenant.verification || {}),
    score,
    riskLevel,
    checks,
    failedChecks,
  };

  await tenant.save();

  return tenant;
};