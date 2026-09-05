import { Router } from "express";
import { getMarkets, saveMarkets } from "../controllers/marketsController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { requireTenant, requireTenantRole } from "../middlewares/tenantMiddleware.js";

const router = Router();

router.use(protect, requireTenant);
router.get("/", getMarkets);
router.patch("/", requireTenantRole("owner", "admin"), saveMarkets);

export default router;
