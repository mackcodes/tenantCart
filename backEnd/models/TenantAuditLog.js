import mongoose from "mongoose";

const tenantAuditLogSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    targetType: {
      type: String,
      default: "tenant",
      trim: true,
      maxlength: 80,
    },
    targetId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: "",
      maxlength: 100,
    },
  },
  { timestamps: true }
);

tenantAuditLogSchema.index({ tenant: 1, createdAt: -1 });

export default mongoose.model("TenantAuditLog", tenantAuditLogSchema);
