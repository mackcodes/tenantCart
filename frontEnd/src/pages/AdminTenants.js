import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import { listTenants } from "../services/adminTenantService.js";

const statusFilters = [
  "all",
  "pending_verification",
  "pending_review",
  "approved",
  "rejected",
  "suspended",
];

const AdminTenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await listTenants({
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      setTenants(data.tenants || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [statusFilter]);

  return (
    <main className="merchant-products">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Admin workspace</p>

          <h1>Tenant approvals</h1>

          <p className="page-heading__description">
            Review merchant stores and manage their approval status.
          </p>
        </div>
      </section>

      {error && (
        <p className="form-message form-message--error" role="alert">
          {error}
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
              {status === "all" ? "All" : status.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <span className="product-count">
          {tenants.length} tenant{tenants.length === 1 ? "" : "s"}
        </span>
      </section>

      {loading ? (
        <div className="empty-state">
          <p>Loading tenants...</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="empty-state">
          <h2>No tenants found</h2>

          <p>Try a different filter.</p>
        </div>
      ) : (
        tenants.map((tenant) => (
          <div key={tenant._id} className="tenant-card">
            <div className="tenant-card__header">
              <h3>{tenant.storeName}</h3>

              <div className="table-actions">
                <span
                  className={`status tenant-status--${tenant.status}`}
                >
                  {tenant.status?.replace(/_/g, " ")}
                </span>

                <span
                  className={`status risk--${
                    tenant.verification?.riskLevel || "medium"
                  }`}
                >
                  {tenant.verification?.riskLevel || "medium"} risk
                </span>
              </div>
            </div>

            <p>
              /{tenant.slug} · owned by{" "}
              {tenant.owner?.name || "unknown"} (
              {tenant.owner?.email || "no email"})
            </p>

            <div className="table-actions">
              <span className="product-count">
                Score: {tenant.verification?.score ?? 0}%
              </span>

              <Link
                to={`/dashboard/admin/tenants/${tenant._id}`}
                className="button button--ghost button--small"
              >
                Review
              </Link>
            </div>
          </div>
        ))
      )}
    </main>
  );
};

export default AdminTenants;
