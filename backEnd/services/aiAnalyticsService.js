// AI Analytics Assistant — NOT YET IMPLEMENTED (stub for next build phase)
// Flow: user NL question -> Gemini function-calling picks an aggregation "tool"
// -> service executes real Mongo aggregation -> result sent back to Gemini for a
// natural-language summary. Falls back to Groq (Llama) if Gemini errors/rate-limits.

// import { GoogleGenAI } from "@google/genai";
// import Groq from "groq-sdk";
// import Order from "../models/Order.js";
// import Product from "../models/Product.js";

const analyticsFunctionDeclarations = [
  {
    name: "getRevenueByPeriod",
    description: "Sum order revenue for a tenant grouped by day/week/month within a date range",
    parameters: {
      type: "OBJECT",
      properties: {
        groupBy: { type: "STRING", enum: ["day", "week", "month"] },
        startDate: { type: "STRING" },
        endDate: { type: "STRING" },
      },
      required: ["groupBy"],
    },
  },
  {
    name: "getTopProducts",
    description: "Return top-selling products for a tenant by quantity or revenue",
    parameters: {
      type: "OBJECT",
      properties: {
        metric: { type: "STRING", enum: ["quantity", "revenue"] },
        limit: { type: "NUMBER" },
      },
      required: ["metric"],
    },
  },
];

// const runAggregation = async (tenantId, functionName, args) => { ... build Mongo pipeline ... };

export const answerQuestion = async (tenantId, question) => {
  throw new Error(
    "aiAnalyticsService not implemented yet — wire up Gemini function-calling with Groq fallback here"
  );
};

export const _functionDeclarations = analyticsFunctionDeclarations;