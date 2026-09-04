import express from "express";

import {
  getShippingSettings,
  updateShippingSettings,
} from "../controllers/shippingController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  requireTenant,
  requireTenantRole,
} from "../middlewares/tenantMiddleware.js";

const router = express.Router();

router.use(protect, requireTenant, requireTenantRole("owner", "admin"));
router.get("/settings", getShippingSettings);
router.put("/settings", updateShippingSettings);

export default router;