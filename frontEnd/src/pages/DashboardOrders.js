import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getMerchantOrders,
  updateOrderStatus,
  refundOrder,
} from "../services/orderService.js";

const statusFilters = [
  "all",
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const nextStatusOptions = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const DashboardOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [refundingOrderId, setRefundingOrderId] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMerchantOrders(
        statusFilter === "all" ? undefined : statusFilter
      );

      setOrders(data.orders || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const orderCountLabel = useMemo(() => {
    return `${orders.length} order${orders.length === 1 ? "" : "s"}`;
  }, [orders]);

  const toggleExpanded = (orderId) => {
    setExpandedOrderId((current) =>
      current === orderId ? null : orderId
    );
  };

  const handleStatusChange = async (order, status) => {
    if (status === order.status) {
      return;
    }

    try {
      setUpdatingOrderId(order._id);
      setError("");
      setNotice("");

      await updateOrderStatus(order._id, status);
      await loadOrders();

      setNotice(`Order updated to "${status}"`);
    } catch (requestError) {
      setError(requestError.message || "Unable to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleRefund = async (order) => {
    const confirmed = window.confirm(
      `Issue a full refund of ${formatCurrency(order.totalAmount)} for order by ${order.customerName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRefundingOrderId(order._id);
      setError("");
      setNotice("");

      await refundOrder(order._id);
      await loadOrders();

      setNotice(`Refund issued for order by ${order.customerName}`);
    } catch (requestError) {
      setError(requestError.message || "Unable to issue refund");
    } finally {
      setRefundingOrderId(null);
    }
  };

  return (
    <main className="merchant-products">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Merchant workspace</p>

          <h1>Orders</h1>

          <p className="page-heading__description">
            Track incoming orders and update fulfillment status.
          </p>
        </div>
      </section>

      {error && (
        <p className="form-message form-message--error" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p className="form-message form-message--success" role="status">
          {notice}
        </p>
      )}

      <section className="catalog-toolbar">
        <div className="order-status-filters">
          {statusFilters.map((status) => (
            <button
              key={status}
              type="button"
              className={
                "button button--small " +
                (statusFilter === status
                  ? "button--primary"
                  : "button--ghost")
              }
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" : status}
            </button>
          ))}
        </div>

        <span className="product-count">{orderCountLabel}</span>
      </section>

      {loading ? (
        <div className="empty-state">
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h2>No orders yet</h2>

          <p>Orders placed by customers will show up here.</p>
        </div>
      ) : (
        <div className="product-table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <React.Fragment key={order._id}>
                  <tr>
                    <td>
                      <div className="product-cell">
                        <div>
                          <strong>{order.customerName}</strong>

                          <small>{order.customerEmail}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      {order.items?.length || 0} item
                      {order.items?.length === 1 ? "" : "s"}
                    </td>

                    <td>{formatCurrency(order.totalAmount)}</td>

                    <td>
                      <span
                        className={`status order-status--${order.status}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td>{formatDate(order.createdAt)}</td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="button button--ghost button--small"
                          onClick={() => toggleExpanded(order._id)}
                        >
                          {expandedOrderId === order._id
                            ? "Hide"
                            : "View"}
                        </button>

                        {["paid", "shipped"].includes(order.status) && (
                          <button
                            type="button"
                            className="button button--ghost button--small"
                            disabled={refundingOrderId === order._id}
                            onClick={() => handleRefund(order)}
                          >
                            {refundingOrderId === order._id
                              ? "Refunding…"
                              : "Refund"}
                          </button>
                        )}

                        {order.status !== "refunded" && (
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order._id}
                            onChange={(event) =>
                              handleStatusChange(
                                order,
                                event.target.value
                              )
                            }
                          >
                            {nextStatusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>

                  {expandedOrderId === order._id && (
                    <tr>
                      <td colSpan={6}>
                        <div className="order-details">
                          <div>
                            <strong>Shipping address</strong>

                            <p>
                              {order.shippingAddress?.line1}
                              {order.shippingAddress?.line2
                                ? `, ${order.shippingAddress.line2}`
                                : ""}
                              , {order.shippingAddress?.city},{" "}
                              {order.shippingAddress?.state}{" "}
                              {order.shippingAddress?.postalCode},{" "}
                              {order.shippingAddress?.country}
                            </p>
                          </div>

                          <div>
                            <strong>Shipping method</strong>

                            <p>
                              {order.shippingMethod === "pickup"
                                ? "Local pickup"
                                : "Delivery"}
                              {order.shippingAmount > 0
                                ? ` · ${formatCurrency(order.shippingAmount)}`
                                : " · Free"}
                            </p>
                          </div>

                          <div>
                            <strong>Items</strong>

                            <ul className="order-items-list">
                              {order.items?.map((item, index) => (
                                <li key={index}>
                                  {item.name} × {item.quantity} —{" "}
                                  {formatCurrency(
                                    item.price * item.quantity
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {order.status === "refunded" && (
                            <div>
                              <strong>Refund details</strong>

                              <p>
                                Amount refunded:{" "}
                                {formatCurrency(order.refundedAmount)}
                              </p>

                              {order.refundId && (
                                <p style={{ fontSize: "0.8em", color: "#666" }}>
                                  Refund ID: {order.refundId}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};

export default DashboardOrders;
