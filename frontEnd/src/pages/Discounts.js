import { useEffect, useState } from "react";

import DashboardLayout from "../components/dashboard/DashboardLayout.js";
import { useAuth } from "../context/AuthContext.js";
import {
  createDiscount,
  deleteDiscount,
  getDiscounts,
  updateDiscount,
} from "../services/discountService.js";

const emptyForm = {
  code: "",
  type: "percentage",
  value: "",
  minOrderAmount: "0",
  maxUses: "",
  expiresAt: "",
};

const Discounts = () => {
  const { user, tenants } = useAuth();
  const currentTenant = user?.tenant;
  const currentMembership = tenants.find(
    ({ tenant }) => String(tenant?._id) === String(currentTenant?._id)
  );
  const canManage = ["owner", "admin"].includes(currentMembership?.role);

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadDiscounts = async () => {
    try {
      const data = await getDiscounts();
      setDiscounts(data.discounts || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load discounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant && canManage) {
      loadDiscounts();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [currentTenant?._id]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setCreating(true);

    try {
      await createDiscount({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrderAmount: Number(form.minOrderAmount || 0),
        maxUses: form.maxUses === "" ? null : Number(form.maxUses),
        expiresAt: form.expiresAt || null,
      });
      setForm(emptyForm);
      setNotice("Discount created.");
      await loadDiscounts();
    } catch (requestError) {
      setError(requestError.message || "Unable to create discount.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (discount) => {
    setError("");
    setBusyId(discount._id);

    try {
      await updateDiscount(discount._id, { active: !discount.active });
      await loadDiscounts();
    } catch (requestError) {
      setError(requestError.message || "Unable to update discount.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (discount) => {
    if (!window.confirm(`Delete discount code "${discount.code}"?`)) {
      return;
    }

    setError("");
    setBusyId(discount._id);

    try {
      await deleteDiscount(discount._id);
      await loadDiscounts();
    } catch (requestError) {
      setError(requestError.message || "Unable to delete discount.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout>
      <main className="account-settings">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Manage</p>
            <h1>Discounts</h1>
            <p className="page-heading__description">
              Create discount codes customers can apply at checkout.
            </p>
          </div>
        </section>

        {!currentTenant ? (
          <section className="settings-panel">
            <h2>No active store</h2>
            <p>Create a store before adding discounts.</p>
          </section>
        ) : !canManage ? (
          <section className="settings-panel">
            <h2>Discounts</h2>
            <p>Only the store owner or admins can manage discounts.</p>
          </section>
        ) : (
          <>
            <section className="settings-panel">
              <h2>New discount code</h2>
              <form onSubmit={handleCreate} className="settings-danger-form" style={{ flexWrap: "wrap" }}>
                <input
                  name="code"
                  placeholder="Code (e.g. SAVE10)"
                  value={form.code}
                  onChange={handleFormChange}
                  required
                />
                <select name="type" value={form.type} onChange={handleFormChange}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
                <input
                  name="value"
                  type="number"
                  min="0"
                  placeholder="Value"
                  value={form.value}
                  onChange={handleFormChange}
                  required
                />
                <input
                  name="minOrderAmount"
                  type="number"
                  min="0"
                  placeholder="Min order amount"
                  value={form.minOrderAmount}
                  onChange={handleFormChange}
                />
                <input
                  name="maxUses"
                  type="number"
                  min="1"
                  placeholder="Max uses (optional)"
                  value={form.maxUses}
                  onChange={handleFormChange}
                />
                <input
                  name="expiresAt"
                  type="date"
                  value={form.expiresAt}
                  onChange={handleFormChange}
                />
                <button type="submit" className="button button--secondary" disabled={creating}>
                  {creating ? "Adding..." : "Add discount"}
                </button>
              </form>
            </section>

            <section className="settings-panel">
              <h2>Existing discounts</h2>
              {loading ? (
                <p>Loading discounts...</p>
              ) : discounts.length === 0 ? (
                <p>No discounts created yet.</p>
              ) : (
                <table className="settings-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Min order</th>
                      <th>Uses</th>
                      <th>Expires</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discounts.map((discount) => (
                      <tr key={discount._id}>
                        <td>{discount.code}</td>
                        <td>{discount.type}</td>
                        <td>
                          {discount.type === "percentage"
                            ? `${discount.value}%`
                            : `₹${discount.value}`}
                        </td>
                        <td>₹{discount.minOrderAmount}</td>
                        <td>
                          {discount.usedCount}
                          {discount.maxUses ? ` / ${discount.maxUses}` : ""}
                        </td>
                        <td>
                          {discount.expiresAt
                            ? new Date(discount.expiresAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>{discount.active ? "Active" : "Inactive"}</td>
                        <td>
                          <button
                            type="button"
                            className="button button--secondary"
                            disabled={busyId === discount._id}
                            onClick={() => handleToggleActive(discount)}
                          >
                            {discount.active ? "Deactivate" : "Activate"}
                          </button>{" "}
                          <button
                            type="button"
                            className="button button--danger"
                            disabled={busyId === discount._id}
                            onClick={() => handleDelete(discount)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}

        {notice && <p className="settings-notice">{notice}</p>}
        {error && (
          <p className="settings-error" role="alert">
            {error}
          </p>
        )}
      </main>
    </DashboardLayout>
  );
};

export default Discounts;
