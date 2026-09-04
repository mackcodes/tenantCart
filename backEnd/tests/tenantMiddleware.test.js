import assert from "node:assert/strict";
import test from "node:test";

import TenantMembership from "../models/TenantMembership.js";
import {
  requireTenant,
  requireTenantRole,
} from "../middlewares/tenantMiddleware.js";

const tenantA = "507f1f77bcf86cd799439011";
const tenantB = "507f1f77bcf86cd799439012";

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("tenant context rejects a selected tenant without membership", async () => {
  const originalFindOne = TenantMembership.findOne;
  TenantMembership.findOne = async () => null;

  try {
    const response = createResponse();
    let proceeded = false;

    await requireTenant(
      {
        user: { _id: "user-a", tenant: null },
        get: () => tenantB,
      },
      response,
      () => {
        proceeded = true;
      }
    );

    assert.equal(proceeded, false);
    assert.equal(response.statusCode, 403);
    assert.equal(
      response.body.message,
      "No active tenant membership for this account"
    );
  } finally {
    TenantMembership.findOne = originalFindOne;
  }
});

test("tenant context attaches only the membership-selected tenant", async () => {
  const originalFindOne = TenantMembership.findOne;
  const membership = {
    tenant: tenantA,
    role: "manager",
  };
  TenantMembership.findOne = async () => membership;

  try {
    const request = {
      user: { _id: "user-a", tenant: null },
      get: () => tenantA,
    };
    const response = createResponse();

    await requireTenant(request, response, () => {});

    assert.equal(request.tenantId, tenantA);
    assert.equal(request.tenantMembership, membership);
  } finally {
    TenantMembership.findOne = originalFindOne;
  }
});

test("tenant roles prevent staff from catalog changes", () => {
  const response = createResponse();
  let proceeded = false;

  requireTenantRole("owner", "admin", "manager")(
    { tenantMembership: { role: "staff" } },
    response,
    () => {
      proceeded = true;
    }
  );

  assert.equal(proceeded, false);
  assert.equal(response.statusCode, 403);
});
