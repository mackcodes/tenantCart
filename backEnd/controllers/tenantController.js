import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";

import Tenant from "../models/Tenant.js";
import TenantAuditLog from "../models/TenantAuditLog.js";
import TenantMembership from "../models/TenantMembership.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { recordTenantAudit } from "../services/tenantAuditService.js";

const assignableRoles = new Set([
  "admin",
  "manager",
  "staff",
]);

const canManageMembers = new Set([
  "owner",
  "admin",
]);

const getTenantId = (value) => value?._id || value;

const ensureLegacyOwnerMembership = async (user) => {
  const tenantId = getTenantId(user.tenant);

  if (!tenantId) {
    return;
  }

  const tenant = await Tenant.findOne({
    _id: tenantId,
    owner: user._id,
  }).select("_id");

  if (!tenant) {
    return;
  }

  await TenantMembership.findOneAndUpdate(
    { tenant: tenant._id, user: user._id },
    {
      $setOnInsert: {
        role: "owner",
        status: "active",
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
};

export const listMyTenants = async (
  req,
  res,
  next
) => {
  try {
    await ensureLegacyOwnerMembership(req.user);

    const memberships = await TenantMembership.find({
      user: req.user._id,
      status: "active",
    })
      .populate(
        "tenant",
        "_id storeName slug status branding"
      )
      .sort({ createdAt: 1 })
      .lean();

    const activeMemberships = memberships
      .filter((membership) => membership.tenant);
    const currentTenantId = String(
      getTenantId(req.user.tenant) || ""
    );
    const hasCurrentTenant = activeMemberships.some(
      (membership) => String(membership.tenant._id) === currentTenantId
    );
    const resolvedCurrentTenantId = hasCurrentTenant
      ? currentTenantId
      : getTenantId(activeMemberships[0]?.tenant) || null;

    if (String(resolvedCurrentTenantId || "") !== currentTenantId) {
      await User.updateOne(
        { _id: req.user._id },
        { $set: { tenant: resolvedCurrentTenantId } }
      );
    }

    return res.json({
      tenants: activeMemberships
        .map((membership) => ({
          tenant: membership.tenant,
          role: membership.role,
        })),
      currentTenantId: resolvedCurrentTenantId,
    });
  } catch (error) {
    next(error);
  }
};

export const selectCurrentTenant = async (
  req,
  res,
  next
) => {
  try {
    const { tenantId } = req.body;

    if (!mongoose.isValidObjectId(tenantId)) {
      return res.status(400).json({
        message: "A valid tenant ID is required",
      });
    }

    const membership = await TenantMembership.findOne({
      tenant: tenantId,
      user: req.user._id,
      status: "active",
    }).populate("tenant", "_id storeName slug status branding");

    if (!membership) {
      return res.status(403).json({
        message: "You do not have access to this tenant",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { tenant: membership.tenant._id },
      { new: true }
    )
      .select("_id name email role tenant")
      .populate("tenant");

    await recordTenantAudit({
      tenantId: membership.tenant._id,
      actorId: req.user._id,
      action: "tenant.selected",
      request: req,
    });

    return res.json({
      message: "Current tenant changed",
      tenant: membership.tenant,
      role: membership.role,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const getTenantMembers = async (
  req,
  res,
  next
) => {
  try {
    const memberships = await TenantMembership.find({
      tenant: req.tenantId,
    })
      .populate("user", "_id name email role")
      .populate("invitedBy", "_id name email")
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ members: memberships });
  } catch (error) {
    next(error);
  }
};

export const getTenantAuditLogs = async (
  req,
  res,
  next
) => {
  try {
    const logs = await TenantAuditLog.find({
      tenant: req.tenantId,
    })
      .populate("actor", "_id name email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({ logs });
  } catch (error) {
    next(error);
  }
};

export const exportTenantData = async (
  req,
  res,
  next
) => {
  try {
    const [tenant, products, orders, members] = await Promise.all([
      Tenant.findById(req.tenantId)
        .select("-razorpay.keySecret")
        .lean(),
      Product.find({ tenantId: req.tenantId }).lean(),
      Order.find({ tenant: req.tenantId }).lean(),
      TenantMembership.find({ tenant: req.tenantId })
        .populate("user", "_id name email")
        .lean(),
    ]);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${tenant.slug}-tenant-export.json"`
    );

    return res.json({
      exportedAt: new Date().toISOString(),
      tenant,
      products,
      orders,
      members,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTenant = async (
  req,
  res,
  next
) => {
  try {
    const confirmationSlug = String(
      req.body.confirmationSlug || ""
    ).trim().toLowerCase();
    const tenant = await Tenant.findById(req.tenantId)
      .select("_id slug");

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    if (confirmationSlug !== tenant.slug) {
      return res.status(400).json({
        message: "Enter the exact store address to confirm deletion",
      });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await Product.deleteMany({ tenantId: tenant._id })
          .session(session);
        await Order.deleteMany({ tenant: tenant._id })
          .session(session);
        await TenantAuditLog.deleteMany({ tenant: tenant._id })
          .session(session);
        await TenantMembership.deleteMany({ tenant: tenant._id })
          .session(session);
        await User.updateMany(
          { tenant: tenant._id },
          { $set: { tenant: null } },
          { session }
        );
        await Tenant.deleteOne({ _id: tenant._id })
          .session(session);
      });
    } finally {
      await session.endSession();
    }

    const imageDirectory = path.join(
      process.cwd(),
      "uploads",
      "products",
      String(tenant._id)
    );

    try {
      await fs.rm(imageDirectory, {
        recursive: true,
        force: true,
      });
    } catch (fileError) {
      console.error("Unable to remove tenant product images:", fileError);
    }

    return res.json({
      message: "Tenant and all tenant-owned data deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const addTenantMember = async (
  req,
  res,
  next
) => {
  try {
    if (!canManageMembers.has(req.tenantMembership.role)) {
      return res.status(403).json({
        message: "Only tenant owners and admins can manage members",
      });
    }

    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const role = req.body.role || "staff";

    if (!email) {
      return res.status(400).json({
        message: "Member email is required",
      });
    }

    if (!assignableRoles.has(role)) {
      return res.status(400).json({
        message: "Member role must be admin, manager, or staff",
      });
    }

    const user = await User.findOne({ email }).select(
      "_id name email role"
    );

    if (!user) {
      return res.status(404).json({
        message: "Create an account for this email before adding it to a tenant",
      });
    }

    const existingMembership = await TenantMembership.findOne({
      tenant: req.tenantId,
      user: user._id,
    });

    if (existingMembership?.role === "owner") {
      return res.status(409).json({
        message: "The tenant owner cannot be changed through member management",
      });
    }

    const membership = await TenantMembership.findOneAndUpdate(
      {
        tenant: req.tenantId,
        user: user._id,
      },
      {
        $set: {
          role,
          status: "active",
          invitedBy: req.user._id,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).populate("user", "_id name email role");

    await User.updateOne(
      { _id: user._id, tenant: null },
      { $set: { tenant: req.tenantId } }
    );

    await recordTenantAudit({
      tenantId: req.tenantId,
      actorId: req.user._id,
      action: "member.added",
      targetType: "user",
      targetId: user._id,
      metadata: { role },
      request: req,
    });

    return res.status(201).json({
      message: "Tenant member added",
      member: membership,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTenantMember = async (
  req,
  res,
  next
) => {
  try {
    if (!canManageMembers.has(req.tenantMembership.role)) {
      return res.status(403).json({
        message: "Only tenant owners and admins can manage members",
      });
    }

    const { userId } = req.params;
    const { role, status } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        message: "A valid user ID is required",
      });
    }

    if (
      role !== undefined &&
      !assignableRoles.has(role)
    ) {
      return res.status(400).json({
        message: "Member role must be admin, manager, or staff",
      });
    }

    if (
      status !== undefined &&
      !["active", "suspended"].includes(status)
    ) {
      return res.status(400).json({
        message: "Member status must be active or suspended",
      });
    }

    const membership = await TenantMembership.findOne({
      tenant: req.tenantId,
      user: userId,
    });

    if (!membership) {
      return res.status(404).json({
        message: "Tenant member not found",
      });
    }

    if (membership.role === "owner") {
      return res.status(403).json({
        message: "The tenant owner cannot be changed through member management",
      });
    }

    if (role !== undefined) {
      membership.role = role;
    }

    if (status !== undefined) {
      membership.status = status;
    }

    await membership.save();

    await recordTenantAudit({
      tenantId: req.tenantId,
      actorId: req.user._id,
      action: "member.updated",
      targetType: "user",
      targetId: membership.user,
      metadata: {
        role: membership.role,
        status: membership.status,
      },
      request: req,
    });

    return res.json({
      message: "Tenant member updated",
      member: membership,
    });
  } catch (error) {
    next(error);
  }
};
