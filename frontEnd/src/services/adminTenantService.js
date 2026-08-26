import api from "./api";

export const listTenants = ({ status, riskLevel } = {}) => {
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  if (riskLevel) {
    params.set("riskLevel", riskLevel);
  }

  const query = params.toString() ? `?${params.toString()}` : "";

  return api(`/admin/tenants${query}`);
};

export const getTenantForReview = (tenantId) => {
  return api(`/admin/tenants/${tenantId}`);
};

export const reEvaluateTenant = (tenantId) => {
  return api(`/admin/tenants/${tenantId}/re-evaluate`, {
    method: "PATCH",
  });
};

export const approveTenant = (tenantId) => {
  return api(`/admin/tenants/${tenantId}/approve`, {
    method: "PATCH",
  });
};

export const rejectTenant = (tenantId, reason) => {
  return api(`/admin/tenants/${tenantId}/reject`, {
    method: "PATCH",
    body: { reason },
  });
};

export const requestTenantInformation = (tenantId, reason) => {
  return api(`/admin/tenants/${tenantId}/request-information`, {
    method: "PATCH",
    body: { reason },
  });
};

export const suspendTenant = (tenantId, reason) => {
  return api(`/admin/tenants/${tenantId}/suspend`, {
    method: "PATCH",
    body: { reason },
  });
};
