import { useEffect, useState } from "react";

import DashboardLayout from "../components/dashboard/DashboardLayout.js";
import { useAuth } from "../context/AuthContext.js";
import { getPolicies, savePolicies } from "../services/policyService.js";

const policyFields = [
  { key: "refundPolicy", label: "Refund policy" },
  { key: "shippingPolicy", label: "Shipping policy" },
  { key: "cancellationPolicy", label: "Cancellation policy" },
  { key: "privacyPolicy", label: "Privacy policy" },
  { key: "termsOfService", label: "Terms of service" },
];

const emptyPolicies = {
  refundPolicy: "",
  shippingPolicy: "",
  cancellationPolicy: "",
  privacyPolicy: "",
  termsOfService: "",
};

const StorePolicies = () => {
  const { user, tenants } = useAuth();
  const currentTenant = user?.tenant;
  const currentMembership = tenants.find(
    ({ tenant }) => String(tenant?._id) === String(currentTenant?._id)
  );
  const canManage = ["owner", "admin"].includes(currentMembership?.role);

  const [policies, setPolicies] = useState(emptyPolicies);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!currentTenant) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const data = await getPolicies();
        setPolicies({ ...emptyPolicies, ...data.policies });
      } catch (requestError) {
        setError(requestError.message || "Unable to load store policies.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentTenant?._id]);

  const handleChange = (key, value) => {
    setPolicies((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);

    try {
      const data = await savePolicies(policies);
      setPolicies({ ...emptyPolicies, ...data.policies });
      setNotice("Store policies saved successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save store policies.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="account-settings">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Store policies</h1>
            <p className="page-heading__description">
              These policies are shown to customers on your storefront and
              at checkout.
            </p>
          </div>
        </section>

        {!currentTenant ? (
          <section className="settings-panel">
            <h2>No active store</h2>
            <p>Create a store before setting policies.</p>
          </section>
        ) : loading ? (
          <section className="settings-panel">
            <p>Loading store policies...</p>
          </section>
        ) : !canManage ? (
          <section className="settings-panel">
            <h2>Store policies</h2>
            <p>Only the store owner or admins can edit policies.</p>
          </section>
        ) : (
          <form onSubmit={handleSubmit}>
            {policyFields.map(({ key, label }) => (
              <section className="settings-panel" key={key}>
                <h2>{label}</h2>
                <textarea
                  rows={6}
                  value={policies[key]}
                  onChange={(event) => handleChange(key, event.target.value)}
                  placeholder={`Describe your ${label.toLowerCase()}...`}
                  style={{ width: "100%", font: "inherit", padding: "10px" }}
                />
              </section>
            ))}

            <button
              type="submit"
              className="button button--secondary"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save policies"}
            </button>
          </form>
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

export default StorePolicies;
