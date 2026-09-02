import express from "express";

import {
  getStorefront,
  getStorefrontPreview,
  getPublicProduct,
} from "../controllers/storefrontController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { requireTenant } from "../middlewares/tenantMiddleware.js";
import requireMerchant from "../middlewares/merchantMiddleware.js";

const router = express.Router();

router.get(
  "/preview/mine",
  protect,
  requireMerchant,
  requireTenant,
  getStorefrontPreview
);

router.get("/:slug", getStorefront);

router.get(
  "/:slug/products/:productSlug",
  getPublicProduct
);

export default router;