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
