import { Fragment, useEffect, useState } from "react";

import DashboardLayout from "../components/dashboard/DashboardLayout.js";
import { useAuth } from "../context/AuthContext.js";
import { getCustomerById, getCustomers } from "../services/customerService.js";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

const DashboardCustomers = () => {
  const { user } = useAuth();
  const currentTenant = user?.tenant;

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadCustomers = async (searchTerm) => {
    setLoading(true);
    setError("");

    try {
      const data = await getCustomers(searchTerm);
      setCustomers(data.customers || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant) {
      loadCustomers("");
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [currentTenant?._id]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadCustomers(search);
  };

  const toggleExpand = async (customer) => {
    if (expandedId === customer._id) {
      setExpandedId(null);
      setOrderHistory([]);
      return;
    }

    setExpandedId(customer._id);
    setLoadingHistory(true);

    try {
      const data = await getCustomerById(customer._id);
      setOrderHistory(data.orders || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load order history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="account-settings">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Manage</p>
            <h1>Customers</h1>
            <p className="page-heading__description">
              Everyone who has placed an order at your store.
            </p>
          </div>
        </section>

        {!currentTenant ? (
          <section className="settings-panel">
            <h2>No active store</h2>
            <p>Create a store before viewing customers.</p>
          </section>
        ) : (
          <section className="settings-panel">
            <form onSubmit={handleSearchSubmit} className="settings-danger-form">
              <input
                type="search"
                placeholder="Search by name or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="submit" className="button button--secondary">
                Search
              </button>
            </form>

            {loading ? (
              <p>Loading customers...</p>
            ) : customers.length === 0 ? (
              <p>No customers yet.</p>
            ) : (
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Orders</th>
                    <th>Total spent</th>
                    <th>Last order</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <Fragment key={customer._id}>
                      <tr
                        onClick={() => toggleExpand(customer)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{customer.name}</td>
                        <td>{customer.email}</td>
                        <td>{customer.phone || "—"}</td>
                        <td>{customer.totalOrders}</td>
                        <td>{formatCurrency(customer.totalSpent)}</td>
                        <td>
                          {customer.lastOrderAt
                            ? new Date(customer.lastOrderAt).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                      {expandedId === customer._id && (
                        <tr>
                          <td colSpan={6}>
                            {loadingHistory ? (
                              <p>Loading order history...</p>
                            ) : orderHistory.length === 0 ? (
                              <p>No orders found.</p>
                            ) : (
                              <ul className="settings-audit-log">
                                {orderHistory.map((order) => (
                                  <li key={order._id}>
                                    Order #{order._id.slice(-6)} ·{" "}
                                    {formatCurrency(order.totalAmount)} ·{" "}
                                    {order.status} ·{" "}
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {error && (
          <p className="settings-error" role="alert">
            {error}
          </p>
        )}
      </main>
    </DashboardLayout>
  );
};

export default DashboardCustomers;
