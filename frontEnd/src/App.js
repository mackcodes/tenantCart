import React from "react";

import "./styles/merchant-products.css"

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext.js";

import DashboardLayout from "./components/dashboard/DashboardLayout.js";
import ComingSoon from "./components/ComingSoon.js";
import MerchantProducts from "./pages/MerchantProducts.js";
import DashboardOrders from "./pages/DashboardOrders.js";
import DashboardAnalytics from "./pages/DashboardAnalytics.js";
import AdminTenants from "./pages/AdminTenants.js";
import AdminTenantReview from "./pages/AdminTenantReview.js";
import Storefront from "./pages/Storefront.js";
import StorePreview from "./pages/StorePreview.js";
import Checkout from "./pages/Checkout.js";
import LandingPage from "./pages/LandingPage.js";
import Login from "./pages/Login.js";
import AdminLogin from "./pages/AdminLogin.js";
import RegisterAccount from "./pages/RegisterAccount.js";
import RegisterStore from "./pages/RegisterStore.js";
import ForgotPassword from "./pages/ForgotPassword.js";
import ResetPassword from "./pages/ResetPassword.js";
import VerifyEmail from "./pages/VerifyEmail.js";
import ResendVerification from "./pages/ResendVerification.js";
import Dashboard from "./pages/Dashboard.js";
import DashboardTemplates from "./pages/DashboardTemplates.js";
import PaymentSettings from "./pages/PaymentSettings.js";
import AccountSettings from "./pages/AccountSettings.js";
import ShippingSettings from "./pages/ShippingSettings.js";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Checking authentication...</p>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const ProtectedRoute = ({ children }) => {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <p>Checking authentication...</p>
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
};

const StoreSetupRoute = ({ children }) => {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <p>Checking authentication...</p>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    user.role !== "merchant" &&
    user.role !== "user"
  ) {
    return (
      <Navigate
        to={user.role === "admin" ? "/dashboard/admin/tenants" : "/dashboard"}
        replace
      />
    );
  }

  if (user.tenant) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <p>Checking authentication...</p>;
  }

  if (!user) {
    return children;
  }

  return (
    <Navigate
      to="/dashboard"
      replace
    />
  );
};

const RecoveryRoute = ({ children }) => {
  return children;
};

const DashboardHome = () => {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <Navigate to="/dashboard/admin/tenants" replace />;
  }

  return <Dashboard />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/store/:slug"
        element={<Storefront />}
      />

      <Route
        path="/store/:slug/checkout"
        element={<Checkout />}
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      <Route
        path="/register-account"
        element={
          <PublicRoute>
            <RegisterAccount />
          </PublicRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <RecoveryRoute>
            <ForgotPassword />
          </RecoveryRoute>
        }
      />

      <Route
        path="/reset-password/:token"
        element={
          <RecoveryRoute>
            <ResetPassword />
          </RecoveryRoute>
        }
      />

      <Route
        path="/verify-email/:token"
        element={
          <RecoveryRoute>
            <VerifyEmail />
          </RecoveryRoute>
        }
      />

      <Route
        path="/resend-verification"
        element={
          <RecoveryRoute>
            <ResendVerification />
          </RecoveryRoute>
        }
      />

      <Route
        path="/register-store"
        element={
          <StoreSetupRoute>
            <RegisterStore />
          </StoreSetupRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/products"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <MerchantProducts />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/templates"
        element={
          <ProtectedRoute>
            <DashboardTemplates />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/orders"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardOrders />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/customers"
        element={
          <ProtectedRoute>
            <ComingSoon title="Customers" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/growth"
        element={
          <ProtectedRoute>
            <ComingSoon title="Growth" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/discounts"
        element={
          <ProtectedRoute>
            <ComingSoon title="Discounts" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/content"
        element={
          <ProtectedRoute>
            <ComingSoon title="Content" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/markets"
        element={
          <ProtectedRoute>
            <ComingSoon title="Markets" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/analytics"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardAnalytics />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/admin/tenants"
        element={
          <AdminRoute>
            <DashboardLayout>
              <AdminTenants />
            </DashboardLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/dashboard/admin/tenants/:id"
        element={
          <AdminRoute>
            <DashboardLayout>
              <AdminTenantReview />
            </DashboardLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/dashboard/settings/payments"
        element={
          <ProtectedRoute>
            <PaymentSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/settings/shipping"
        element={
          <ProtectedRoute>
            <ShippingSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/settings/policies"
        element={
          <ProtectedRoute>
            <ComingSoon title="Store policies" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/settings/billing"
        element={
          <ProtectedRoute>
            <ComingSoon title="Billing and plan" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/settings/account"
        element={
          <ProtectedRoute>
            <AccountSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute>
            <ComingSoon title="Profile" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/store-preview"
        element={
          <ProtectedRoute>
            <StorePreview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <ComingSoon title="Help center" />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
