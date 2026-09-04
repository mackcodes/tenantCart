import api from "./api.js";

export const getMyTenants = () =>
  api("/tenants/mine");

export const setCurrentTenant = (tenantId) =>
  api("/tenants/current", {
    method: "PUT",
    body: { tenantId },
  });

export const exportCurrentTenant = () =>
  api("/tenants/current/export");

export const deleteCurrentTenant = (confirmationSlug) =>
  api("/tenants/current", {
    method: "DELETE",
    body: { confirmationSlug },
  });

export const getTenantMembers = () =>
  api("/tenants/current/members");

export const addTenantMember = (email, role) =>
  api("/tenants/current/members", {
    method: "POST",
    body: { email, role },
  });

export const updateTenantMember = (userId, updates) =>
  api(`/tenants/current/members/${userId}`, {
    method: "PATCH",
    body: updates,
  });

export const getTenantAuditLogs = () =>
  api("/tenants/current/audit-logs");
