import mongoose from "mongoose";

const tenantMembershipSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "manager", "staff"],
      default: "staff",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

tenantMembershipSchema.index(
  { tenant: 1, user: 1 },
  { unique: true }
);

tenantMembershipSchema.index({ user: 1, status: 1 });

export default mongoose.model(
  "TenantMembership",
  tenantMembershipSchema
);
