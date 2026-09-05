import DashboardLayout from "../components/dashboard/DashboardLayout.js";
import { useAuth } from "../context/AuthContext.js";

const Billing = () => {
  const { user } = useAuth();
  const currentTenant = user?.tenant;

  return (
    <DashboardLayout>
      <main className="account-settings">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Billing and Plan</h1>
            <p className="page-heading__description">
              View your current subscription plan and billing details.
            </p>
          </div>
        </section>

        <section className="settings-panel">
          <div className="settings-panel__header">
            <div>
              <h2>Current Plan</h2>
              <p>Your store subscription details and usage limits.</p>
            </div>
            <span
              style={{
                backgroundColor: "#e6f4ea",
                color: "#137333",
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: "16px",
                fontSize: "0.875rem",
              }}
            >
              Active
            </span>
          </div>

          <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "8px" }}>
              <span style={{ color: "#68756d" }}>Plan Tier</span>
              <strong>Standard Plan (Free Tier)</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "8px" }}>
              <span style={{ color: "#68756d" }}>Store Name</span>
              <strong>{currentTenant?.storeName || "—"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "8px" }}>
              <span style={{ color: "#68756d" }}>Transaction Fee</span>
              <strong>0% (No platform commission)</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px" }}>
              <span style={{ color: "#68756d" }}>Billing Cycle</span>
              <strong>Lifetime Access</strong>
            </div>
          </div>
        </section>

        <section className="settings-panel">
          <h2>Payment Methods & Invoices</h2>
          <p style={{ color: "#68756d", marginTop: "4px" }}>
            No paid add-ons or recurring subscription fees are required for your account.
          </p>
        </section>
      </main>
    </DashboardLayout>
  );
};

export default Billing;
