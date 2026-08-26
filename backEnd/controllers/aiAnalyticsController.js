import * as aiAnalyticsService from "../services/aiAnalyticsService.js";

export const askAnalytics = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: "question is required" });
    const answer = await aiAnalyticsService.answerQuestion(req.tenantId, question);
    res.json({ answer });
  } catch (err) {
    next(err);
  }
};