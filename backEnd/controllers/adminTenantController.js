import Tenant from "../models/Tenant.js";
import asyncHandler from "../utils/asyncHandler.js";
import { evaluateTenant } from "../services/tenantVerificationService.js";

const reviewableStatuses = [
  "pending_verification",
  "pending_review",
  "approved",
  "rejected",
  "suspended",
];

export const listTenants = asyncHandler(async (req, res) => {
  const filter = {};

  if (
    req.query.status &&
    reviewableStatuses.includes(req.query.status)
  ) {
    filter.status = req.query.status;
  }

  if (["low", "medium", "high"].includes(req.query.riskLevel)) {
    filter["verification.riskLevel"] = req.query.riskLevel;
  }

  const tenants = await Tenant.find(filter)
    .populate("owner", "name email role")
    .sort({ createdAt: -1 });

  res.json({
    count: tenants.length,
    tenants,
  });
});

export const reEvaluateTenant = asyncHandler(async (req, res) => {
  const tenant = await evaluateTenant(req.params.id);

  res.json({
    message: "Tenant re-evaluated",
    tenant,
  });
});

export const getTenantForReview = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id).populate(
    "owner",
    "name email role"
  );

  if (!tenant) {
    return res.status(404).json({
      message: "Tenant not found",
    });
  }

  res.json({ tenant });
});

export const approveTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: "approved",
        "verification.reviewedAt": new Date(),
        "verification.reviewedBy": req.user._id,
        "verification.rejectionReason": "",
      },
    },
    { new: true, runValidators: true }
  );

  if (!tenant) {
    return res.status(404).json({
      message: "Tenant not found",
    });
  }

  res.json({
    message: "Tenant approved successfully",
    tenant,
  });
});

export const rejectTenant = asyncHandler(async (req, res) => {
  const reason = String(req.body.reason || "").trim();

  if (reason.length < 5) {
    return res.status(400).json({
      message: "A rejection reason of at least 5 characters is required",
    });
  }

  const tenant = await Tenant.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: "rejected",
        "verification.reviewedAt": new Date(),
        "verification.reviewedBy": req.user._id,
        "verification.rejectionReason": reason,
      },
    },
    { new: true, runValidators: true }
  );

  if (!tenant) {
    return res.status(404).json({
      message: "Tenant not found",
    });
  }

  res.json({
    message: "Tenant rejected successfully",
    tenant,
  });
});

export const requestTenantInformation = asyncHandler(
  async (req, res) => {
    const reason = String(req.body.reason || "").trim();

    if (reason.length < 5) {
      return res.status(400).json({
        message: "A reason of at least 5 characters is required",
      });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "pending_verification",
          "verification.reviewedAt": new Date(),
          "verification.reviewedBy": req.user._id,
          "verification.rejectionReason": reason,
        },
      },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    res.json({
      message: "More information requested",
      tenant,
    });
  }
);

export const suspendTenant = asyncHandler(async (req, res) => {
  const reason = String(req.body.reason || "").trim();

  if (reason.length < 5) {
    return res.status(400).json({
      message: "A suspension reason of at least 5 characters is required",
    });
  }

  const tenant = await Tenant.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: "suspended",
        "verification.reviewedAt": new Date(),
        "verification.reviewedBy": req.user._id,
        "verification.rejectionReason": reason,
      },
    },
    { new: true, runValidators: true }
  );

  if (!tenant) {
    return res.status(404).json({
      message: "Tenant not found",
    });
  }

  res.json({
    message: "Tenant suspended successfully",
    tenant,
  });
});