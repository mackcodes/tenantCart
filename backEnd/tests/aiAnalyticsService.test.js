import assert from "node:assert/strict";
import test from "node:test";

import { _analyticsInternals } from "../services/aiAnalyticsService.js";

const tenantId = "507f1f77bcf86cd799439011";

test("revenue analytics scopes results to a tenant's completed orders", () => {
  const pipeline = _analyticsInternals.buildRevenuePipeline(tenantId, {
    groupBy: "month",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
  });

  assert.deepEqual(pipeline[0].$match.tenant.toString(), tenantId);
  assert.deepEqual(pipeline[0].$match.status.$in, ["paid", "shipped", "delivered"]);
  assert.equal(pipeline[0].$match.createdAt.$gte.toISOString(), "2026-01-01T00:00:00.000Z");
  assert.equal(pipeline[2].$sort._id, 1);
});

test("top products caps results and ranks by the selected metric", () => {
  const pipeline = _analyticsInternals.buildTopProductsPipeline(tenantId, {
    metric: "quantity",
    limit: 100,
  });

  assert.equal(pipeline[3].$sort.rankingMetric, -1);
  assert.equal(pipeline[4].$limit, 20);
  assert.deepEqual(pipeline[2].$group.rankingMetric, { $sum: "$items.quantity" });
});

test("analytics aggregations reject unsupported grouping and metrics", () => {
  assert.throws(
    () => _analyticsInternals.buildRevenuePipeline(tenantId, { groupBy: "quarter" }),
    /grouped by day, week, or month/
  );
  assert.throws(
    () => _analyticsInternals.buildTopProductsPipeline(tenantId, { metric: "profit" }),
    /quantity or revenue/
  );
});