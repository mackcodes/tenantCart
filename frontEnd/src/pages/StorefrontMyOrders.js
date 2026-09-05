import { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useCustomerAuth } from "../context/CustomerAuthContext.js";
import { getMyOrders } from "../services/storefrontCustomerService.js";

import "./StorefrontAuth.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/**
 * Customer order-history page — /store/:slug/my-orders
 *
 * Renders only when the customer is authenticated (App.js wraps this in a
 * CustomerRoute that redirects to /store/:slug/account if not logged in).
 */
const StorefrontMyOrders = ({ slug, storeName }) => {
  const { slug: routeSlug } = useParams();
  const storeSlug = slug || routeSlug;
  const { customer, logout, loading: authLoading } = useCustomerAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getMyOrders(storeSlug);
        if (!cancelled) {
          setOrders(data.orders || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load your orders");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);

  const handleLogout = async () => {
    await logout();
    navigate(`/store/${storeSlug}/account`, { replace: true });
  };

  if (authLoading) {
    return (
      <div className="my-orders-page">
        <p style={{ padding: "48px", textAlign: "center", color: "#68756d" }}>
          Checking session…
        </p>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <header className="my-orders-header">
        <Link to={`/store/${storeSlug}`} className="my-orders-brand">
          {storeName || "Store"}
        </Link>

        <div className="my-orders-header-right">
          {customer && (
            <span>{customer.name || customer.email}</span>
          )}
          <button type="button" className="my-orders-logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="my-orders-content">
        <h1>Your orders</h1>
        <p className="my-orders-subtitle">
          Orders placed at {storeName || "this store"} with your account.
        </p>

        <Link className="my-orders-back-link" to={`/store/${storeSlug}`}>
          ← Back to store
        </Link>

        {loading && (
          <p style={{ color: "#68756d" }}>Loading your orders…</p>
        )}

        {error && (
          <div>
            <p className="auth-error" role="alert">{error}</p>
            {error.toLowerCase().includes("not found") && (
              <p className="my-orders-store-note">
                This store is not publicly available yet. The owner must have
                the store approved before customers can browse it or view
                orders.
              </p>
            )}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="my-orders-empty">
            <p>You haven't placed any orders yet.</p>
            <Link to={`/store/${storeSlug}`}>Browse products</Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="my-orders-list">
            {orders.map((order) => (
              <div key={order._id} className="my-order-card">
                <div className="my-order-card-header">
                  <div>
                    <p className="my-order-id">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="my-order-date">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`my-order-status my-order-status--${order.status}`}>
                    {order.status}
                  </span>
                </div>

                <ul className="my-order-items">
                  {(order.items || []).map((item, index) => (
                    <li key={index} className="my-order-item">
                      <span>
                        {item.name}{" "}
                        <span className="my-order-item-qty">× {item.quantity}</span>
                      </span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <div className="my-order-total-row">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorefrontMyOrders;
