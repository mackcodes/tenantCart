import api from "./api.js";

export const getContent = () => api("/content");

export const saveContent = (content) =>
  api("/content", {
    method: "PUT",
    body: content,
  });
