import express from "express";

import {
  createOrder,
  getMerchantOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController.js";

import { refundOrder } from "../controllers/paymentController.js";

import { protect } from "../middlewares/authMiddleware.js";
import {
  requireTenant,
  requireTenantRole,
} from "../middlewares/tenantMiddleware.js";
import { optionalCustomer } from "../middlewares/customerAuthMiddleware.js";
import validateObjectId from "../middlewares/validateObjectId.js";

const router = express.Router();

// Public — guest checkout against a specific store.
// optionalCustomer attaches req.customer when a valid customer session cookie
// is present, enabling order linking without breaking the unauthenticated path.
router.post("/checkout/:slug", optionalCustomer, createOrder);


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
router.post(
  "/:id/refund",
  validateObjectId("id"),
  requireTenantRole("owner", "admin"),
  refundOrder
);

export default router;
