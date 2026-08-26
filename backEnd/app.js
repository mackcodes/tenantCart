import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import storefrontRoutes from "./routes/storefrontRoutes.js";
import adminTenantRoutes from "./routes/adminTenantRoutes.js";
import aiAnalyticsRoutes from "./routes/aiAnalyticsRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL ||
    "https://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    service: "tenantcart-backend",
  });
});

app.get("/api/v1/debug", (req, res) => {
  res.json({
    message: "Backend API is reachable",
    path: req.originalUrl,
    port: process.env.PORT || 8080,
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin/tenants", adminTenantRoutes);
app.use("/api/v1/storefront", storefrontRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/ai-analytics", aiAnalyticsRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.use((error, req, res, next) => {
  console.error(error.stack);

  res.status(error.statusCode || 500).json({
    message: error.message || "Internal Server Error",
  });
});

export default app;
