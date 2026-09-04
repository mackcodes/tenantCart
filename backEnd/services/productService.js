import Product from "../models/Product.js";

export const listByTenant = async (tenantId) => {
  return Product.find({
    tenantId,
  }).sort({
    createdAt: -1,
  });
};

export const create = async (tenantId, data) => {
  return Product.create({
    ...data,
    tenantId,
  });
};

export const update = async (
  tenantId,
  productId,
  data
) => {
  return Product.findOneAndUpdate(
    {
      _id: productId,
      tenantId,
    },
    data,
    {
      new: true,
      runValidators: true,
    }
  );
};

export const remove = async (
  tenantId,
  productId
) => {
  return Product.findOneAndDelete({
    _id: productId,
      tenantId,
  });
};
