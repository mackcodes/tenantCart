import { Router } from "express";

import {
  addTenantMember,
  deleteTenant,
  exportTenantData,
  getTenantAuditLogs,
  getTenantMembers,
  listMyTenants,
  selectCurrentTenant,
  updateTenantMember,
} from "../controllers/tenantController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  requireTenant,
  requireTenantRole,
} from "../middlewares/tenantMiddleware.js";
import validateObjectId from "../middlewares/validateObjectId.js";

const router = Router();

router.get("/mine", protect, listMyTenants);
router.put("/current", protect, selectCurrentTenant);

router.use(protect, requireTenant);

router.get(
  "/current/members",
  requireTenantRole("owner", "admin"),
  getTenantMembers
);
router.get(
  "/current/audit-logs",
  requireTenantRole("owner", "admin"),
  getTenantAuditLogs
);
router.get(
  "/current/export",
  requireTenantRole("owner"),
  exportTenantData
);
router.delete(
  "/current",
  requireTenantRole("owner"),
  deleteTenant
);
router.post(
  "/current/members",
  requireTenantRole("owner", "admin"),
  addTenantMember
);
router.patch(
  "/current/members/:userId",
  validateObjectId("userId"),
  requireTenantRole("owner", "admin"),
  updateTenantMember
);

export default router;
