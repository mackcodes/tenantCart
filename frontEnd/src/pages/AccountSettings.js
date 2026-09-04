import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/dashboard/DashboardLayout.js";
import { useAuth } from "../context/AuthContext.js";
import {
  deleteCurrentTenant,
  exportCurrentTenant,
} from "../services/tenantService.js";

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user, tenants, refreshUser } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmationSlug, setConfirmationSlug] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const currentTenant = user?.tenant;
  const currentMembership = tenants.find(
    ({ tenant }) => String(tenant?._id) === String(currentTenant?._id)
  );
  const isOwner = currentMembership?.role === "owner";

  const handleExport = async () => {
    setError("");
    setNotice("");
    setExporting(true);

    try {
      const data = await exportCurrentTenant();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${currentTenant.slug}-tenant-export.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setNotice("Your tenant data export has been downloaded.");
    } catch (requestError) {
      setError(requestError.message || "Unable to export tenant data.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (confirmationSlug.trim().toLowerCase() !== currentTenant.slug) {
      setError("Enter the exact store address to confirm deletion.");
      return;
    }

    setDeleting(true);

    try {
      await deleteCurrentTenant(confirmationSlug.trim());
      await refreshUser();
      navigate("/register-store", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to delete this store.");
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="account-settings">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Account settings</h1>
            <p className="page-heading__description">
              Manage your account and the data belonging to your active store.
            </p>
          </div>
        </section>

        {!currentTenant ? (
          <section className="settings-panel">
            <h2>No active store</h2>
            <p>Create a store before managing tenant data.</p>
          </section>
        ) : !isOwner ? (
          <section className="settings-panel">
            <h2>Store data</h2>
            <p>Only the store owner can export or delete this store's data.</p>
          </section>
        ) : (
          <>
            <section className="settings-panel">
              <div className="settings-panel__header">
                <div>
                  <p className="eyebrow">{currentTenant.storeName}</p>
                  <h2>Export store data</h2>
                </div>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? "Preparing export..." : "Download export"}
                </button>
              </div>
              <p>
                Download a JSON copy of your store, products, orders, and team
                membership records.
              </p>
            </section>

            <section className="settings-panel settings-panel--danger">
              <p className="eyebrow">Permanent action</p>
              <h2>Delete store</h2>
              <p>
                This permanently deletes the store and all of its products,
                orders, audit logs, memberships, and product images.
              </p>
              <form onSubmit={handleDelete}>
                <label htmlFor="confirmation-slug">
                  Type <strong>{currentTenant.slug}</strong> to confirm
                </label>
                <div className="settings-danger-form">
                  <input
                    id="confirmation-slug"
                    type="text"
                    value={confirmationSlug}
                    onChange={(event) => setConfirmationSlug(event.target.value)}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <button
                    type="submit"
                    className="button button--danger"
                    disabled={deleting}
                  >
                    {deleting ? "Deleting store..." : "Delete store"}
                  </button>
                </div>
              </form>
            </section>
          </>
        )}

        {notice && <p className="settings-notice">{notice}</p>}
        {error && <p className="settings-error" role="alert">{error}</p>}
      </main>
    </DashboardLayout>
  );
};

export default AccountSettings;