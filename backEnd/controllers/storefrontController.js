import Tenant from "../models/Tenant.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";

const normalizeSlug = (value) =>
  value?.trim().toLowerCase();

const findPublicTenant = async (slug) => {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  return Tenant.findOne({
    slug: normalizedSlug,
    status: "approved",
  }).select(
    "_id storeName slug description category branding status shipping policies content"
  );
};

export const getStorefrontPreview = asyncHandler(
  async (req, res) => {
    const tenant = await Tenant.findById(req.tenantId).select(
      "_id storeName slug description category branding status address shipping"
    );

    if (!tenant) {
      return res.status(404).json({
        message: "Create a store before previewing it",
      });
    }

    const products = await Product.find({
      tenantId: tenant._id,
      isActive: true,
    })
      .select(
        "name slug description price compareAtPrice stock category images isActive createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      store: tenant,
      products,
    });
  }
);

export const getStorefront = asyncHandler(
  async (req, res) => {
    const tenant = await findPublicTenant(
      req.storeSlug ?? req.params.slug
    );

    if (!tenant) {
      return res.status(404).json({
        message: "Store not found or not approved",
      });
    }

    const products = await Product.find({
      tenantId: tenant._id,
      isActive: true,
    })
      .select(
        "name slug description price compareAtPrice stock category images isActive createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      store: tenant,
      products,
    });
  }
);

export const getPublicProduct = asyncHandler(
  async (req, res) => {
    const tenant = await findPublicTenant(
      req.storeSlug ?? req.params.slug
    );

    if (!tenant) {
      return res.status(404).json({
        message: "Store not found or not approved",
      });
    }

    const productSlug = normalizeSlug(
      req.params.productSlug
    );

    if (!productSlug) {
        return res.status(404).json({
            message: "Product not found",
        });
    }

    const product = await Product.findOne({
      tenantId: tenant._id,
      slug: productSlug,
      isActive: true,
    })
      .select(
        "name slug description price compareAtPrice stock category images isActive createdAt updatedAt"
      )
      .lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.json({
      store: tenant,
      product,
    });
  }
);