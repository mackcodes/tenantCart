import express from "express";

import {
  createOrder,
  getMerchantOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController.js";

import { protect } from "../middlewares/authMiddleware.js";
import validateObjectId from "../middlewares/validateObjectId.js";

const router = express.Router();

// Public — guest checkout against a specific store
router.post("/checkout/:slug", createOrder);

// Merchant-only — requires authentication
router.get("/", protect, getMerchantOrders);
router.get("/:id", protect, validateObjectId("id"), getOrderById);
router.patch("/:id", protect, validateObjectId("id"), updateOrderStatus);

export default router;