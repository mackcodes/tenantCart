import { Router } from "express";
import { askAnalytics } from "../controllers/aiAnalyticsController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { requireTenant } from "../middlewares/tenantMiddleware.js";

const router = Router();

router.use(protect, requireTenant);
router.post("/ask", askAnalytics);

export default router;