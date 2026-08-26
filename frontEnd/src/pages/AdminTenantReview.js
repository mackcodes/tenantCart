import {
  useEffect,
  useState,
} from "react";

import { useParams, useNavigate } from "react-router-dom";

import {
  getTenantForReview,
  approveTenant,
  rejectTenant,
  requestTenantInformation,
  suspendTenant,
  reEvaluateTenant,
} from "../services/adminTenantService.js";

const checkLabels = {
  emailVerified: "Email verified",
  requiredFieldsComplete: "Store profile complete",
  slugAvailable: "Store URL available",
};

const AdminTenantReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [reasonAction, setReasonAction] = useState(null);
  const [reason, setReason] = useState("");

  const loadTenant = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTenantForReview(id);

      setTenant(data.tenant);
    } catch (requestError) {
      setError(requestError.message || "Unable to load tenant");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
  }, [id]);

  const runAction = async (actionFn) => {
    try {
      setActionLoading(true);
      setError("");
      setNotice("");

      const data = await actionFn();

      setTenant(data.tenant);
      setNotice(data.message || "Tenant updated");
      setReasonAction(null);
      setReason("");
    } catch (requestError) {
      setError(requestError.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = () => runAction(() => approveTenant(id));
  const handleReEvaluate = () => runAction(() => reEvaluateTenant(id));

  const handleReasonSubmit = (event) => {
    event.preventDefault();

    if (reason.trim().length < 5) {
      setError("Reason must be at least 5 characters");
      return;
    }

    if (reasonAction === "reject") {
      runAction(() => rejectTenant(id, reason));
    } else if (reasonAction === "suspend") {
      runAction(() => suspendTenant(id, reason));
    } else if (reasonAction === "request-information") {
      runAction(() => requestTenantInformation(id, reason));
    }
  };

  if (loading) {
    return (
      <main className="merchant-products">
        <div className="empty-state">
          <p>Loading tenant...</p>
        </div>
      </main>
    );
  }

  if (!tenant) {
    return (
      <main className="merchant-products">
        <p className="form-message form-message--error">
          {error || "Tenant not found"}
        </p>
      </main>
    );
  }

  const checks = tenant.verification?.checks || {};

  return (
    <main className="merchant-products">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Admin workspace</p>

          <h1>{tenant.storeName}</h1>

          <p className="page-heading__description">
            /{tenant.slug} · {tenant.category}
          </p>
        </div>

        <button
          type="button"
          className="button button--ghost"
          onClick={() => navigate("/dashboard/admin/tenants")}
        >
          Back to list
        </button>
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

      <div className="tenant-card">
        <div className="tenant-card__header">
          <h3>Status</h3>

          <div className="table-actions">
            <span className={`status tenant-status--${tenant.status}`}>
              {tenant.status?.replace(/_/g, " ")}
            </span>

            <span
              className={`status risk--${
                tenant.verification?.riskLevel || "medium"
              }`}
            >
              {tenant.verification?.riskLevel || "medium"} risk ·{" "}
              {tenant.verification?.score ?? 0}%
            </span>
          </div>
        </div>

        <ul className="checks-list">
          {Object.entries(checkLabels).map(([key, label]) => (
            <li key={key}>
              <span className={checks[key] ? "check--pass" : "check--fail"}>
                {checks[key] ? "✓" : "✕"}
              </span>
              {label}
            </li>
          ))}
        </ul>

        {tenant.verification?.rejectionReason && (
          <p>
            <strong>Last review note:</strong>{" "}
            {tenant.verification.rejectionReason}
          </p>
        )}
      </div>

      <div className="tenant-card">
        <div className="tenant-card__header">
          <h3>Store details</h3>
        </div>

        <p>Owner: {tenant.owner?.name} ({tenant.owner?.email})</p>
        <p>Business email: {tenant.businessEmail || "—"}</p>
        <p>Business phone: {tenant.businessPhone || "—"}</p>
        <p>
          Address: {tenant.address?.line1}
          {tenant.address?.line2 ? `, ${tenant.address.line2}` : ""},{" "}
          {tenant.address?.city}, {tenant.address?.state}{" "}
          {tenant.address?.postalCode}, {tenant.address?.country}
        </p>
      </div>

      <div className="tenant-card">
        <div className="tenant-card__header">
          <h3>Actions</h3>
        </div>

        <div className="table-actions">
          <button
            type="button"
            className="button button--primary"
            disabled={actionLoading}
            onClick={handleApprove}
          >
            Approve
          </button>

          <button
            type="button"
            className="button button--ghost"
            disabled={actionLoading}
            onClick={handleReEvaluate}
          >
            Re-run automated check
          </button>

          <button
            type="button"
            className="button button--ghost"
            disabled={actionLoading}
            onClick={() => setReasonAction("request-information")}
          >
            Request information
          </button>

          <button
            type="button"
            className="button button--danger"
            disabled={actionLoading}
            onClick={() => setReasonAction("suspend")}
          >
            Suspend
          </button>

          <button
            type="button"
            className="button button--danger"
            disabled={actionLoading}
            onClick={() => setReasonAction("reject")}
          >
            Reject
          </button>
        </div>

        {reasonAction && (
          <form className="reason-panel" onSubmit={handleReasonSubmit}>
            <label htmlFor="reason">
              Reason for{" "}
              {reasonAction === "request-information"
                ? "requesting information"
                : reasonAction}
            </label>

            <textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why (minimum 5 characters)"
            />

            <div className="table-actions">
              <button
                type="submit"
                className="button button--primary button--small"
                disabled={actionLoading}
              >
                Submit
              </button>

              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => {
                  setReasonAction(null);
                  setReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
};

export default AdminTenantReview;
