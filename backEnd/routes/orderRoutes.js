import express from "express";

import {
  createOrder,
  getMerchantOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController.js";

import { protect } from "../middlewares/authMiddleware.js";
import {
  requireTenant,
  requireTenantRole,
} from "../middlewares/tenantMiddleware.js";
import validateObjectId from "../middlewares/validateObjectId.js";

const router = express.Router();

// Public — guest checkout against a specific store
router.post("/checkout/:slug", createOrder);

// Tenant members only — every query uses the verified active tenant.
router.use(protect, requireTenant);
router.get(
  "/",
  requireTenantRole("owner", "admin", "manager", "staff"),
  getMerchantOrders
);
router.get(
  "/:id",
  validateObjectId("id"),
  requireTenantRole("owner", "admin", "manager", "staff"),
  getOrderById
);
router.patch(
  "/:id",
  validateObjectId("id"),
  requireTenantRole("owner", "admin", "manager", "staff"),
  updateOrderStatus
);

export default router;
