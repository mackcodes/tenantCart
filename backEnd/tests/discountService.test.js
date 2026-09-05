import assert from "node:assert/strict";
import test from "node:test";

import Discount from "../models/Discount.js";
import { resolveDiscount } from "../services/discountService.js";

const tenantId = "507f1f77bcf86cd799439011";

test("resolveDiscount rejects a code that does not belong to the tenant", async () => {
  const originalFindOne = Discount.findOne;
  Discount.findOne = async () => null;

  try {
    await assert.rejects(
      () => resolveDiscount({ tenantId, code: "MISSING10", subtotal: 500 }),
      /Invalid or inactive discount code/
    );
  } finally {
    Discount.findOne = originalFindOne;
  }
});

test("resolveDiscount rejects orders below the minimum order amount", async () => {
  const originalFindOne = Discount.findOne;
  Discount.findOne = async () => ({
    _id: "discount-1",
    code: "SAVE10",
    type: "percentage",
    value: 10,
    minOrderAmount: 1000,
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
  });

  try {
    await assert.rejects(
      () => resolveDiscount({ tenantId, code: "SAVE10", subtotal: 500 }),
      /minimum order/
    );
  } finally {
    Discount.findOne = originalFindOne;
  }
});

test("resolveDiscount computes a percentage discount amount", async () => {
  const originalFindOne = Discount.findOne;
  Discount.findOne = async () => ({
    _id: "discount-1",
    code: "SAVE10",
    type: "percentage",
    value: 10,
    minOrderAmount: 0,
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
  });

  try {
    const result = await resolveDiscount({ tenantId, code: "save10", subtotal: 1000 });
    assert.equal(result.discountAmount, 100);
  } finally {
    Discount.findOne = originalFindOne;
  }
});
