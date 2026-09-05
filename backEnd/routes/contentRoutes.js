import express from "express";

import { getContent, updateContent } from "../controllers/contentController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  requireTenant,
  requireTenantRole,
} from "../middlewares/tenantMiddleware.js";

const router = express.Router();

router.use(protect, requireTenant, requireTenantRole("owner", "admin"));
router.get("/", getContent);
router.put("/", updateContent);

export default router;
