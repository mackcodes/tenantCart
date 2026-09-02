import OpenAI from 'openai';
import Groq from "groq-sdk";
import mongoose from "mongoose";

import Order from "../models/Order.js";

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

const PAID_ORDER_STATUSES = ["paid", "shipped", "delivered"];
const DEFAULT_LOOKBACK_DAYS = 30;
const MAX_RESULTS = 20;

const openrouterModel = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b";
const groqModel = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const createServiceError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getDateRange = (startDate, endDate) => {
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw createServiceError("Analytics date range is invalid", 400);
  }

  return { start, end };
};

const buildRevenuePipeline = (tenantId, { groupBy = "month", startDate, endDate } = {}) => {
  if (!['day', 'week', 'month'].includes(groupBy)) {
    throw createServiceError("Revenue analytics must be grouped by day, week, or month", 400);
  }

  const { start, end } = getDateRange(startDate, endDate);
  const dateFormat = groupBy === "day" ? "%Y-%m-%d" : groupBy === "week" ? "%G-W%V" : "%Y-%m";

  return [
    {
      $match: {
        tenant: new mongoose.Types.ObjectId(tenantId),
        status: { $in: PAID_ORDER_STATUSES },
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, period: "$_id", revenue: 1, orders: 1 } },
  ];
};

const buildTopProductsPipeline = (tenantId, { metric = "revenue", limit = 5 } = {}) => {
  if (!["quantity", "revenue"].includes(metric)) {
    throw createServiceError("Top product analytics must use quantity or revenue", 400);
  }

  const resultLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 5, 1), MAX_RESULTS);
  const metricExpression = metric === "quantity"
    ? { $sum: "$items.quantity" }
    : { $sum: { $multiply: ["$items.price", "$items.quantity"] } };

  return [
    {
      $match: {
        tenant: new mongoose.Types.ObjectId(tenantId),
        status: { $in: PAID_ORDER_STATUSES },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        quantity: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        rankingMetric: metricExpression,
      },
    },
    { $sort: { rankingMetric: -1, name: 1 } },
    { $limit: resultLimit },
    { $project: { _id: 0, name: 1, quantity: 1, revenue: 1 } },
  ];
};

const runAggregation = async (tenantId, functionName, args) => {
  if (!mongoose.Types.ObjectId.isValid(tenantId)) {
    throw createServiceError("Invalid tenant context", 400);
  }

  if (functionName === "getRevenueByPeriod") {
    return Order.aggregate(buildRevenuePipeline(tenantId, args));
  }

  if (functionName === "getTopProducts") {
    return Order.aggregate(buildTopProductsPipeline(tenantId, args));
  }

  throw createServiceError("Unsupported analytics request", 400);
};

const systemInstruction = "You are TenantCart's analytics assistant. Use the provided analytics tools before making claims about store data. Explain the result concisely, include currency amounts exactly as returned, and say clearly when no data is available. Do not invent metrics or data.";

const answerWithOpenRouter = async (tenantId, question) => {
  // Convert analytics function declarations to OpenAI tool format
  const openrouterTools = analyticsFunctionDeclarations.map((declaration) => ({
    type: "function",
    function: {
      name: declaration.name,
      description: declaration.description,
      parameters: declaration.parameters,
    },
  }));

  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://tenantcart.app',
      'X-Title': 'TenantCart',
    },
  });

  const response = await client.chat.completions.create({
    model: openrouterModel,
    tools: openrouterTools,
    tool_choice: "auto",
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: question },
    ],
  });

  const message = response.choices?.[0]?.message;
  const toolCall = message?.tool_calls?.[0];

  if (!toolCall || toolCall.type !== "function") {
    return message?.content || "I could not determine which analytics to retrieve.";
  }

  let args;
  try {
    args = JSON.parse(toolCall.function.arguments || "{}");
  } catch {
    throw createServiceError("The analytics provider returned invalid tool arguments");
  }

  const result = await runAggregation(tenantId, toolCall.function.name, args);

  // Get summary from OpenRouter
  const summaryResponse = await client.chat.completions.create({
    model: openrouterModel,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: question },
      message,
      {
        role: "user",
        content: `Here are the results: ${JSON.stringify(result)}. Please provide a concise summary.`,
      },
    ],
  });

  return summaryResponse.choices?.[0]?.message?.content || `Analytics results: ${JSON.stringify(result)}`;
};

const groqTools = analyticsFunctionDeclarations.map((declaration) => ({
  type: "function",
  function: {
    name: declaration.name,
    description: declaration.description,
    parameters: {
      ...declaration.parameters,
      type: "object",
      properties: Object.fromEntries(
        Object.entries(declaration.parameters.properties).map(([name, schema]) => [
          name,
          { ...schema, type: schema.type.toLowerCase() },
        ])
      ),
    },
  },
}));

const answerWithGroq = async (tenantId, question) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const initial = await client.chat.completions.create({
    model: groqModel,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: question },
    ],
    tools: groqTools,
    tool_choice: "auto",
  });
  const message = initial.choices[0]?.message;
  const toolCall = message?.tool_calls?.[0];

  if (!toolCall || toolCall.type !== "function") {
    return message?.content || "I could not determine which analytics to retrieve.";
  }

  let args;
  try {
    args = JSON.parse(toolCall.function.arguments || "{}");
  } catch {
    throw createServiceError("The analytics provider returned invalid tool arguments");
  }

  const result = await runAggregation(tenantId, toolCall.function.name, args);
  const summary = await client.chat.completions.create({
    model: groqModel,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: question },
      message,
      { role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) },
    ],
  });

  return summary.choices[0]?.message?.content || "I retrieved the analytics, but could not summarize them.";
};

export const answerQuestion = async (tenantId, question) => {
  // Try OpenRouter (Nemotron) first
  if (process.env.OPENROUTER_API_KEY) {
    try {
      console.log("Attempting analytics with OpenRouter (Nemotron)...");
      return await answerWithOpenRouter(tenantId, question);
    } catch (openrouterError) {
      console.warn(
        "OpenRouter analytics failed:",
        openrouterError.message
      );
    }
  }

  // Fallback to Groq
  if (process.env.GROQ_API_KEY) {
    try {
      console.log("Falling back to Groq for analytics...");
      return await answerWithGroq(tenantId, question);
    } catch (groqError) {
      console.error("Groq analytics failed:", groqError.message);
      throw groqError;
    }
  }

  throw createServiceError(
    "AI analytics is not configured. Set OPENROUTER_API_KEY or GROQ_API_KEY on the server.",
    503
  );
};

export const _functionDeclarations = analyticsFunctionDeclarations;
export const _analyticsInternals = { buildRevenuePipeline, buildTopProductsPipeline, runAggregation };