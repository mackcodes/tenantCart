import api from "./api";

export const askAnalytics = (question) => {
  return api("/ai-analytics/ask", {
    method: "POST",
    body: { question },
  });
};
