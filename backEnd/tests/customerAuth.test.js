import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";

import Customer from "../models/Customer.js";
import Tenant from "../models/Tenant.js";
import { protectCustomer } from "../middlewares/customerAuthMiddleware.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const tenantA = "507f1f77bcf86cd799439011";
const tenantB = "507f1f77bcf86cd799439012";
const customerId = "507f1f77bcf86cd799439013";

const createRes = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("protectCustomer: rejects request with no cookie", async () => {
  const res = createRes();
  let proceeded = false;

  await protectCustomer(
    { cookies: {}, params: { slug: "store-a" } },
    res,
    () => { proceeded = true; }
  );

  assert.equal(proceeded, false);
  assert.equal(res.statusCode, 401);
});

test("protectCustomer: rejects a merchant-kind token", async () => {
  // A merchant token has no `kind` claim.
  const merchantToken = jwt.sign(
    { id: customerId, role: "merchant" },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" }
  );

  const res = createRes();
  let proceeded = false;

  // Mock Tenant.findOne to return a tenant so we get past that check.
  const original = Tenant.findOne;
  Tenant.findOne = () => ({ select: () => Promise.resolve({ _id: tenantA, slug: "store-a" }) });

  try {
    await protectCustomer(
      { cookies: { tenantcart_customer_token: merchantToken }, params: { slug: "store-a" } },
      res,
      () => { proceeded = true; }
    );
  } finally {
    Tenant.findOne = original;
  }

  assert.equal(proceeded, false);
  assert.equal(res.statusCode, 401);
  assert.ok(res.body.message.includes("invalid token type"));
});

test("protectCustomer: rejects Store-A token used against Store-B endpoint", async () => {
  const storeAToken = jwt.sign(
    { sub: customerId, tenantId: tenantA, kind: "customer" },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" }
  );

  const res = createRes();
  let proceeded = false;

  // The request is for Store B.
  const original = Tenant.findOne;
  Tenant.findOne = () => ({ select: () => Promise.resolve({ _id: tenantB, slug: "store-b" }) });

  try {
    await protectCustomer(
      { cookies: { tenantcart_customer_token: storeAToken }, params: { slug: "store-b" } },
      res,
      () => { proceeded = true; }
    );
  } finally {
    Tenant.findOne = original;
  }

  // Critical isolation check: the request must be blocked even though the
  // token is otherwise a valid JWT.
  assert.equal(proceeded, false);
  assert.equal(res.statusCode, 403);
  assert.ok(res.body.message.includes("does not belong to this store"));
});

test("protectCustomer: accepts valid Store-A token against Store-A endpoint", async () => {
  const storeAToken = jwt.sign(
    { sub: customerId, tenantId: tenantA, kind: "customer" },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" }
  );

  const fakeCustomer = {
    _id: customerId,
    tenant: tenantA,
    name: "Alice",
    email: "alice@example.com",
    emailVerified: true,
    passwordChangedAt: null,
  };

  const originalTenant = Tenant.findOne;
  const originalCustomer = Customer.findOne;
  Tenant.findOne = () => ({ select: () => Promise.resolve({ _id: tenantA, slug: "store-a" }) });
  Customer.findOne = () => ({ select: () => Promise.resolve(fakeCustomer) });

  const req = {
    cookies: { tenantcart_customer_token: storeAToken },
    params: { slug: "store-a" },
  };
  const res = createRes();
  let proceeded = false;

  try {
    await protectCustomer(req, res, () => { proceeded = true; });
  } finally {
    Tenant.findOne = originalTenant;
    Customer.findOne = originalCustomer;
  }

  assert.equal(proceeded, true);
  assert.equal(req.customer, fakeCustomer);
  assert.equal(req.storeTenantId, tenantA);
});
