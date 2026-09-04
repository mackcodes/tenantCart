import mongoose from "mongoose";

import Tenant from "../models/Tenant.js";
import TenantMembership from "../models/TenantMembership.js";

const activeStatus = "active";

const getObjectId = (value) => {
  if (!value) {
    return null;
  }

  const id = value._id || value;

  return mongoose.isValidObjectId(id)
    ? id
    : null;
};

const getRequestedTenantId = (req) => {
  const headerValue = req.get("x-tenant-id");

  if (headerValue === undefined) {
    return null;
  }

  return mongoose.isValidObjectId(headerValue)
    ? headerValue
    : false;
};

const createLegacyOwnerMembership = async (
  user,
  tenantId
) => {
  const ownedTenant = await Tenant.findOne({
    _id: tenantId,
    owner: user._id,
  }).select("_id");

  if (!ownedTenant) {
    return null;
  }

  return TenantMembership.findOneAndUpdate(
    {
      tenant: tenantId,
      user: user._id,
    },
    {
      $setOnInsert: {
        role: "owner",
        status: activeStatus,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const requireTenant = async (
  req,
  res,
  next
) => {
  try {
    const requestedTenantId = getRequestedTenantId(req);

    if (requestedTenantId === false) {
      return res.status(400).json({
        message: "X-Tenant-Id must be a valid tenant ID",
      });
    }

    const activeTenantId = getObjectId(req.user?.tenant);
    const tenantId = requestedTenantId || activeTenantId;
    let membership = tenantId
      ? await TenantMembership.findOne({
        tenant: tenantId,
        user: req.user._id,
        status: activeStatus,
      })
      : null;

    // Existing stores predate memberships. Owners receive their first
    // membership transparently, so the migration is backward compatible.
    if (!membership && tenantId && activeTenantId) {
      membership = await createLegacyOwnerMembership(
        req.user,
        tenantId
      );
    }

    if (!membership && !requestedTenantId) {
      membership = await TenantMembership.findOne({
        user: req.user._id,
        status: activeStatus,
      }).sort({ createdAt: 1 });
    }

    if (!membership) {
      return res.status(403).json({
        message: "No active tenant membership for this account",
      });
    }

    req.tenantId = membership.tenant;
    req.tenantMembership = membership;

    next();
  } catch (error) {
    next(error);
  }
};

export const requireTenantRole = (...roles) => (
  req,
  res,
  next
) => {
  if (!req.tenantMembership) {
    return res.status(500).json({
      message: "Tenant context must be resolved before checking permissions",
    });
  }

  if (!roles.includes(req.tenantMembership.role)) {
    return res.status(403).json({
      message: "You do not have permission to perform this tenant action",
    });
  }

  next();
};
