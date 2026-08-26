import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import requireAdmin from "../middlewares/adminMiddleware.js";
import {
  listTenants,
  getTenantForReview,
  approveTenant,
  rejectTenant,
  requestTenantInformation,
  suspendTenant,
  reEvaluateTenant,
} from "../controllers/adminTenantController.js";

const router = express.Router();

router.use(protect);
router.use(requireAdmin);

router.get("/", listTenants);
router.get("/:id", getTenantForReview);
router.patch("/:id/re-evaluate", reEvaluateTenant);
router.patch("/:id/approve", approveTenant);
router.patch("/:id/reject", rejectTenant);
router.patch("/:id/request-information", requestTenantInformation);
router.patch("/:id/suspend", suspendTenant);

export default router;