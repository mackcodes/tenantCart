import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";

import { verifyWebhookSignature, issueRefund } from "../services/razorpayService.js";

// ─── verifyWebhookSignature ───────────────────────────────────────────────────

test("verifyWebhookSignature throws when RAZORPAY_WEBHOOK_SECRET is unset", () => {
  const savedSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET;

  try {
    assert.throws(
      () => verifyWebhookSignature(Buffer.from("{}"), "any"),
      /RAZORPAY_WEBHOOK_SECRET is not configured/
    );
  } finally {
    if (savedSecret !== undefined) {
      process.env.RAZORPAY_WEBHOOK_SECRET = savedSecret;
    }
  }
});

test("verifyWebhookSignature returns true for a correctly signed payload", () => {
  const secret = "test_webhook_secret";
  const rawBody = Buffer.from(JSON.stringify({ event: "payment.captured" }));

  const signature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const savedSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = secret;

  try {
    assert.equal(verifyWebhookSignature(rawBody, signature), true);
  } finally {
    if (savedSecret !== undefined) {
      process.env.RAZORPAY_WEBHOOK_SECRET = savedSecret;
    } else {
      delete process.env.RAZORPAY_WEBHOOK_SECRET;
    }
  }
});

test("verifyWebhookSignature returns false for a tampered payload", () => {
  const secret = "test_webhook_secret";
  const rawBody = Buffer.from(JSON.stringify({ event: "payment.captured" }));
  const tamperedBody = Buffer.from(JSON.stringify({ event: "order.paid" }));

  const signature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const savedSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = secret;

  try {
    assert.equal(verifyWebhookSignature(tamperedBody, signature), false);
  } finally {
    if (savedSecret !== undefined) {
      process.env.RAZORPAY_WEBHOOK_SECRET = savedSecret;
    } else {
      delete process.env.RAZORPAY_WEBHOOK_SECRET;
    }
  }
});

// ─── Webhook route — signature guard ─────────────────────────────────────────

test("webhook endpoint rejects requests with no signature header", async () => {
  const app = (await import("../app.js")).default;

  await new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      getHeader(k) { return this.headers[k]; },
      removeHeader(k) { delete this.headers[k]; },
      status(code) { this.statusCode = code; return this; },
      json(body) {
        try {
          assert.equal(this.statusCode, 400);
          assert.equal(body.message, "Missing webhook signature");
          resolve();
        } catch (err) {
          reject(err);
        }
      },
    };

    app.handle(
      {
        method: "POST",
        url: "/api/v1/payments/razorpay/webhook",
        originalUrl: "/api/v1/payments/razorpay/webhook",
        headers: { "content-type": "application/json" },
        body: Buffer.from("{}"),
      },
      res,
      reject
    );
  });
});

// ─── Refund route — auth guard ────────────────────────────────────────────────

test("refund endpoint requires authentication", async () => {
  const app = (await import("../app.js")).default;

  await new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      getHeader(k) { return this.headers[k]; },
      removeHeader(k) { delete this.headers[k]; },
      status(code) { this.statusCode = code; return this; },
      json(body) {
        try {
          // Without a valid JWT cookie the protect middleware returns 401
          assert.equal(this.statusCode, 401);
          resolve();
        } catch (err) {
          reject(err);
        }
      },
    };

    app.handle(
      {
        method: "POST",
        url: "/api/v1/orders/507f1f77bcf86cd799439011/refund",
        originalUrl: "/api/v1/orders/507f1f77bcf86cd799439011/refund",
        headers: { "content-type": "application/json" },
        body: {},
        cookies: {},
      },
      res,
      reject
    );
  });
});
