import Discount from "../models/Discount.js";

// Shared between the public checkout validation endpoint and order creation
// so pricing rules only live in one place.
export const resolveDiscount = async ({ tenantId, code, subtotal }) => {
  const normalizedCode = String(code || "").trim().toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  const discount = await Discount.findOne({
    tenant: tenantId,
    code: normalizedCode,
    active: true,
  });

  if (!discount) {
    throw Object.assign(new Error("Invalid or inactive discount code"), {
      statusCode: 404,
    });
  }

  if (discount.expiresAt && discount.expiresAt.getTime() < Date.now()) {
    throw Object.assign(new Error("This discount code has expired"), {
      statusCode: 400,
    });
  }

  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    throw Object.assign(new Error("This discount code has reached its usage limit"), {
      statusCode: 400,
    });
  }

  if (subtotal < discount.minOrderAmount) {
    throw Object.assign(
      new Error(
        `This discount code requires a minimum order of ₹${discount.minOrderAmount}`
      ),
      { statusCode: 400 }
    );
  }

  const discountAmount = discount.type === "percentage"
    ? Math.round((subtotal * discount.value) / 100)
    : Math.min(discount.value, subtotal);

  return { discount, discountAmount };
};

// Atomically consumes one use, guarding against the usage-limit race.
export const consumeDiscountUsage = async (discountId, maxUses) => {
  const filter = { _id: discountId };

  if (maxUses !== null && maxUses !== undefined) {
    filter.usedCount = { $lt: maxUses };
  }

  const updated = await Discount.findOneAndUpdate(
    filter,
    { $inc: { usedCount: 1 } },
    { new: true }
  );

  if (!updated) {
    throw Object.assign(
      new Error("This discount code has just reached its usage limit"),
      { statusCode: 409 }
    );
  }

  return updated;
};
