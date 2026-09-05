import express from "express";

import {
  getCustomerById,
  listCustomers,
} from "../controllers/customerController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  requireTenant,
  requireTenantRole,
} from "../middlewares/tenantMiddleware.js";
import validateObjectId from "../middlewares/validateObjectId.js";

const router = express.Router();

router.use(protect, requireTenant, requireTenantRole("owner", "admin", "manager", "staff"));
router.get("/", listCustomers);
router.get("/:id", validateObjectId("id"), getCustomerById);

export default router;
