import { Router } from "express";
import { askAnalytics } from "../controllers/aiAnalyticsController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { requireTenant } from "../middlewares/tenantMiddleware.js";
import requireMerchant from "../middlewares/merchantMiddleware.js";

const router = Router();

router.use(protect, requireMerchant, requireTenant);
router.post("/ask", askAnalytics);

export default router;