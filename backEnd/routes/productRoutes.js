import express from "express";
import {
  createProduct,
  getMerchantProducts,
  getProductById,
  uploadProductImage,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import {protect} from "../middlewares/authMiddleware.js";
import {
  requireTenant,
  requireTenantRole,
} from "../middlewares/tenantMiddleware.js";
import { uploadProductImage as uploadImageFile } from "../middlewares/productImageUpload.js";

const router = express.Router();

router.use(protect, requireTenant);

router.post(
  "/upload",
  requireTenantRole("owner", "admin", "manager"),
  (req, res, next) => {
    uploadImageFile(req, res, (error) => {
      if (error) {
        error.statusCode = error.statusCode || 400;
        next(error);
        return;
      }

      next();
    });
  },
  uploadProductImage
);

router.post(
  "/",
  requireTenantRole("owner", "admin", "manager"),
  createProduct
);

router.get(
  "/",
  requireTenantRole("owner", "admin", "manager", "staff"),
  getMerchantProducts
);

router.get(
  "/:id",
  requireTenantRole("owner", "admin", "manager", "staff"),
  getProductById
);

router.patch(
  "/:id",
  requireTenantRole("owner", "admin", "manager"),
  updateProduct
);

router.delete(
  "/:id",
  requireTenantRole("owner", "admin", "manager"),
  deleteProduct
);

export default router;
