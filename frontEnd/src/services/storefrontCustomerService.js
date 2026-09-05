const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api/v1";

/**
 * Thin fetch wrapper that forwards cookies (credentials: "include") and
 * surfaces server error messages.
 */
const request = async (path, { method = "GET", body } = {}) => {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = { message: `Server returned HTTP ${response.status}` };
  }

  if (!response.ok) {
    const error = new Error(
      data.message || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  return data;
};

// ── Auth ─────────────────────────────────────────────────────────────────────

export const customerRegister = (slug, { name, email, password, confirmPassword }) =>
  request(`/storefront/${slug}/auth/register`, {
    method: "POST",
    body: { name, email, password, confirmPassword },
  });

export const customerLogin = (slug, { email, password }) =>
  request(`/storefront/${slug}/auth/login`, {
    method: "POST",
    body: { email, password },
  });

export const customerLogout = (slug) =>
  request(`/storefront/${slug}/auth/logout`, { method: "POST" });

export const getCustomerMe = (slug) =>
  request(`/storefront/${slug}/auth/me`);

export const verifyCustomerEmail = (slug, token) =>
  request(`/storefront/${slug}/auth/verify-email/${token}`);

export const resendCustomerVerification = (slug, email) =>
  request(`/storefront/${slug}/auth/resend-verification`, {
    method: "POST",
    body: { email },
  });

export const customerForgotPassword = (slug, email) =>
  request(`/storefront/${slug}/auth/forgot-password`, {
    method: "POST",
    body: { email },
  });

export const customerResetPassword = (slug, token, { password, confirmPassword }) =>
  request(`/storefront/${slug}/auth/reset-password/${token}`, {
    method: "POST",
    body: { password, confirmPassword },
  });

// ── Orders ────────────────────────────────────────────────────────────────────

export const getMyOrders = (slug) =>
  request(`/storefront/${slug}/my-orders`);
