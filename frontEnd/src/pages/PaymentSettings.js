import { useEffect, useRef, useState } from "react";
import { getPaymentSettings, savePaymentSettings } from "../services/paymentService.js";
import DashboardLayout from "../components/dashboard/DashboardLayout.js";

const PaymentSettings = () => {
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [onboarded, setOnboarded] = useState(false);
  const [keySecretSaved, setKeySecretSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getPaymentSettings();
        if (isMounted.current) {
          setKeyId(data.keyId || "");
          setKeySecretSaved(data.keySecretSaved || false);
          setOnboarded(data.onboarded || false);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message || "Could not load payment settings");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    load();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!keyId.trim() || !keySecret.trim()) {
      setError("Both Key ID and Key Secret are required.");
      return;
    }

    try {
      setSaving(true);
      const data = await savePaymentSettings({
        keyId: keyId.trim(),
        keySecret: keySecret.trim(),
      });
      setOnboarded(data.onboarded);
      setKeySecretSaved(true);
      setKeySecret("");
      setNotice("Payment settings saved. Your store can now accept Razorpay payments.");
    } catch (err) {
      setError(err.message || "Failed to save payment settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="merchant-products">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Payment settings</h1>
            <p className="page-heading__description">
              Connect your Razorpay account so customers can pay online at checkout.
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

        <section className="payment-settings-section">
          {/* Status badge */}
          <div className="payment-status-card">
            <div className="payment-status-card__header">
              <span className="payment-provider-logo">₹</span>
              <div>
                <strong>Razorpay</strong>
                <p>Accept UPI, cards, net banking, and wallets at checkout.</p>
              </div>
              <span
                className={`payment-status-badge ${
                  onboarded
                    ? "payment-status-badge--active"
                    : "payment-status-badge--inactive"
                }`}
              >
                {onboarded ? "Active" : "Not configured"}
              </span>
            </div>
          </div>

          {/* Credentials form */}
          <div className="payment-credentials-card">
            <h2>API credentials</h2>
            <p className="payment-credentials-hint">
              Find your API keys in the{" "}
              <a
                href="https://dashboard.razorpay.com/app/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                Razorpay Dashboard → Settings → API Keys
              </a>
              . Use <strong>test mode</strong> keys during development.
            </p>

            {loading ? (
              <p>Loading…</p>
            ) : (
              <form className="payment-credentials-form" onSubmit={handleSubmit}>
                <label className="payment-field">
                  <span>Key ID</span>
                  <input
                    type="text"
                    value={keyId}
                    onChange={(e) => setKeyId(e.target.value)}
                    placeholder="rzp_test_xxxxxxxxxxxx"
                    autoComplete="off"
                    required
                  />
                </label>

                <label className="payment-field">
                  <span>
                    Key Secret
                    {keySecretSaved && (
                      <em className="payment-field__saved-note">
                        {" "}— a secret is already saved; enter a new one to replace it
                      </em>
                    )}
                  </span>
                  <input
                    type="password"
                    value={keySecret}
                    onChange={(e) => setKeySecret(e.target.value)}
                    placeholder={keySecretSaved ? "Enter new secret to update" : "Enter your Razorpay Key Secret"}
                    autoComplete="new-password"
                  />
                </label>

                <div className="payment-form-actions">
                  <button
                    type="submit"
                    className="button button--primary"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save credentials"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Info box */}
          <div className="payment-info-box">
            <h3>How it works</h3>
            <ol>
              <li>Enter your Razorpay Key ID and Key Secret above.</li>
              <li>
                When a customer places an order, they'll see a <strong>"Pay with Razorpay"</strong> button at checkout.
              </li>
              <li>
                Razorpay's payment modal opens — customers can pay via UPI, card, net banking, or wallet.
              </li>
              <li>
                On success, the order status in your dashboard changes from <em>pending</em> to <em>paid</em> automatically.
              </li>
            </ol>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
};

export default PaymentSettings;

