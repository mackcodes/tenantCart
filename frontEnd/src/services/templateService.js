import request from "./api.js";

export const getTemplates = () => {
  return request("/templates");
};

export const generateTemplate = (description, category) => {
  return request("/templates/generate", {
    method: "POST",
    body: { description, category },
  });
};

export const getGenerationLimit = () => {
  return request("/templates/generation-limit");
};

export const applyTemplate = (templateId) => {
  return request(`/templates/apply/${templateId}`, {
    method: "POST",
  });
};
