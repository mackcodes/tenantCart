import express from "express";

import {
  createDiscount,
  deleteDiscount,
  listDiscounts,
  updateDiscount,
  validateDiscountPublic,
} from "../controllers/discountController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  requireTenant,
  requireTenantRole,
} from "../middlewares/tenantMiddleware.js";
import validateObjectId from "../middlewares/validateObjectId.js";

const router = express.Router();

// Public — checkout uses this to preview a discount before placing the order.
router.post("/validate/:slug", validateDiscountPublic);

router.use(protect, requireTenant, requireTenantRole("owner", "admin"));
router.get("/", listDiscounts);
router.post("/", createDiscount);
router.patch("/:id", validateObjectId("id"), updateDiscount);
router.delete("/:id", validateObjectId("id"), deleteDiscount);

export default router;
