import express from "express";

import {
  getStorefront,
  getStorefrontPreview,
  getPublicProduct,
} from "../controllers/storefrontController.js";

import { protect } from "../middlewares/authMiddleware.js";
import {
  requireTenant,
  requireTenantRole,
} from "../middlewares/tenantMiddleware.js";
import { resolveStoreSlug } from "../middlewares/resolveStoreSlug.js";

const router = express.Router();

router.get(
  "/preview/mine",
  protect,
  requireTenant,
  requireTenantRole("owner", "admin", "manager", "staff"),
  getStorefrontPreview
);

router.get("/:slug?", resolveStoreSlug, getStorefront);

router.get(
  "/:slug?/products/:productSlug",
  resolveStoreSlug,
  getPublicProduct
);

export default router;
