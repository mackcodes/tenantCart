import * as aiAnalyticsService from "../services/aiAnalyticsService.js";

export const askAnalytics = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ message: "question is required" });
    }
    if (question.length > 1000) {
      return res.status(400).json({ message: "question must be 1000 characters or fewer" });
    }
    const answer = await aiAnalyticsService.answerQuestion(req.tenantId, question.trim());
    res.json({ answer });
  } catch (err) {
    next(err);
  }
};