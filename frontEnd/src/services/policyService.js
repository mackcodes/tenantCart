import api from "./api.js";

export const getPolicies = () => api("/policies");

export const savePolicies = (policies) =>
  api("/policies", {
    method: "PUT",
    body: policies,
  });
