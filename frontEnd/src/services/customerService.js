import api from "./api.js";

export const getCustomers = (search) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";

  return api(`/customers${query}`);
};

export const getCustomerById = (customerId) => api(`/customers/${customerId}`);
