import api from "./api.js";

export const getShippingSettings = () =>
  api("/shipping/settings");

export const saveShippingSettings = (shipping) =>
  api("/shipping/settings", {
    method: "PUT",
    body: shipping,
  });