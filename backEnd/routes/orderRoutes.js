import express from "express";

import {
  createOrder,
  getMerchantOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController.js";

import { protect } from "../middlewares/authMiddleware.js";
import requireMerchant from "../middlewares/merchantMiddleware.js";
import validateObjectId from "../middlewares/validateObjectId.js";

const router = express.Router();

// Public — guest checkout against a specific store
router.post("/checkout/:slug", createOrder);

// Merchant-only — requires authentication
router.get("/", protect, requireMerchant, getMerchantOrders);
router.get("/:id", protect, requireMerchant, validateObjectId("id"), getOrderById);
router.patch("/:id", protect, requireMerchant, validateObjectId("id"), updateOrderStatus);

export default router;