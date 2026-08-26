import request from "./api.js";

export const registerAccount = (
  payload
) => {
  return request("/auth/register-account", {
    method: "POST",
    body: payload,
  });
};

export const registerStore = (
  payload,
  token
) => {
  return request("/auth/register-store", {
    method: "POST",
    body: payload,
    token,
  });
};

export const login = (payload) => {
  return request("/auth/login", {
    method: "POST",
    body: payload,
  });
};

export const getMe = (token) => {
  return request("/auth/me", {
    method: "GET",
    token,
  });
};

export const forgotPassword = (
  email
) => {
  return request("/auth/forgot-password", {
    method: "POST",
    body: {
      email,
    },
  });
};

export const resetPassword = (
  token,
  password,
  confirmPassword
) => {
  return request(`/auth/reset-password/${token}`, {
    method: "POST",
    body: {
      password,
      confirmPassword,
    },
  });
};

export const verifyEmail = (token) => {
  return request(`/auth/verify-email/${token}`, {
    method: "GET",
  });
};

export const resendVerificationEmail = (email) => {
  return request("/auth/resend-verification", {
    method: "POST",
    body: { email },
  });
};