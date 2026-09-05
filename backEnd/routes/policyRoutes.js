import express from "express";

import { getPolicies, updatePolicies } from "../controllers/policyController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  requireTenant,
  requireTenantRole,
} from "../middlewares/tenantMiddleware.js";

const router = express.Router();

router.use(protect, requireTenant, requireTenantRole("owner", "admin"));
router.get("/", getPolicies);
router.put("/", updatePolicies);

export default router;
