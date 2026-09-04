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

const router = express.Router();

router.get(
  "/preview/mine",
  protect,
  requireTenant,
  requireTenantRole("owner", "admin", "manager", "staff"),
  getStorefrontPreview
);

router.get("/:slug", getStorefront);

router.get(
  "/:slug/products/:productSlug",
  getPublicProduct
);

export default router;
