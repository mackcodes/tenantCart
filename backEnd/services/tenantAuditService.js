import TenantAuditLog from "../models/TenantAuditLog.js";

export const recordTenantAudit = async ({
  tenantId,
  actorId,
  action,
  targetType = "tenant",
  targetId = "",
  metadata = {},
  request,
}) => {
  try {
    await TenantAuditLog.create({
      tenant: tenantId,
      actor: actorId || null,
      action,
      targetType,
      targetId: String(targetId),
      metadata,
      ipAddress: request?.ip || "",
    });
  } catch (error) {
    // An audit outage must not turn a successful tenant action into a failed
    // response. The error remains visible to operators for investigation.
    console.error("Unable to write tenant audit log:", error);
  }
};
