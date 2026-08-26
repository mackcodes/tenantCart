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
import { uploadProductImage as uploadImageFile } from "../middlewares/productImageUpload.js";

const router = express.Router();

router.use(protect);

router.post(
  "/upload",
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

router.post("/", createProduct);

router.get("/", getMerchantProducts);

router.get("/:id", getProductById);

router.patch("/:id", updateProduct);

router.delete("/:id", deleteProduct);

export default router;
