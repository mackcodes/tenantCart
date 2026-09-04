import { Router } from "express";
import { askAnalytics } from "../controllers/aiAnalyticsController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  requireTenant,
  requireTenantRole,
} from "../middlewares/tenantMiddleware.js";

const router = Router();

router.use(
  protect,
  requireTenant,
  requireTenantRole("owner", "admin", "manager", "staff")
);
router.post("/ask", askAnalytics);

export default router;
