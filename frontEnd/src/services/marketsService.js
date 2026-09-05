import api from "./api.js";

export const getMarkets = () => api("/markets");
export const saveMarkets = (payload) => api("/markets", { method: "PATCH", body: payload });
