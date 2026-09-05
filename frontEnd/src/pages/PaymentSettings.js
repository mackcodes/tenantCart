import { useEffect, useRef, useState } from "react";
import {
  getPaymentSettings,
  savePaymentSettings,
  disconnectRazorpay,
} from "../services/paymentService.js";
import DashboardLayout from "../components/dashboard/DashboardLayout.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const maskKeyId = (keyId) => {
  if (!keyId) return "";
  // Show first 12 chars (rzp_test_xxxxx) then mask the rest
  if (keyId.length <= 16) return keyId;
  return keyId.slice(0, 12) + "••••" + keyId.slice(-4);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StepBadge = ({ n }) => (
  <span className="rz-step-badge">{n}</span>
);

const OnboardingGuide = ({ onConnect }) => {
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!keyId.trim() || !keySecret.trim() || !webhookSecret.trim()) {
      setError("Key ID, Key Secret, and Webhook Secret are all required.");
      return;
    }
    try {
      setSaving(true);
      const data = await savePaymentSettings({
        keyId: keyId.trim(),
        keySecret: keySecret.trim(),
        webhookSecret: webhookSecret.trim(),
      });
      onConnect(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rz-onboarding-card">
      {/* Hero banner */}
      <div className="rz-onboarding-hero">
        <div className="rz-onboarding-hero__logo">₹</div>
        <div>
          <h2>Accept Payments with Razorpay</h2>
          <p>
            Connect your Razorpay account to let customers pay via UPI, cards,
            net banking, and wallets. Takes about 2 minutes.
          </p>
        </div>
        {!open && (
          <button
            className="button button--primary rz-get-started-btn"
            onClick={() => setOpen(true)}
          >
            Get Started
          </button>
        )}
      </div>

      {open && (
        <div className="rz-onboarding-steps">
          {/* Step 1 */}
          <div className="rz-step">
            <div className="rz-step__header">
              <StepBadge n={1} />
              <h3>Sign up for Razorpay</h3>
            </div>
            <p className="rz-step__body">
              Don&rsquo;t have an account yet?{" "}
              <a
                href="https://razorpay.com/signup/"
                target="_blank"
                rel="noopener noreferrer"
                className="rz-link"
              >
                Create one at razorpay.com →
              </a>{" "}
              You&rsquo;ll need your business email, phone number, and basic KYC
              details (PAN, Aadhaar, bank account). Test mode is available
              immediately after sign-up.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rz-step">
            <div className="rz-step__header">
              <StepBadge n={2} />
              <h3>Copy your API Keys from Razorpay</h3>
            </div>
            <ol className="rz-step__instructions">
              <li>
                Log in to your{" "}
                <a
                  href="https://dashboard.razorpay.com/app/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rz-link"
                >
                  Razorpay Dashboard
                </a>
              </li>
              <li>
                Go to <strong>Settings → API Keys → Generate Test Key</strong>
              </li>
              <li>
                Copy both the <strong>Key ID</strong> (<code className="rz-code">rzp_test_xxxx</code>) and <strong>Key Secret</strong>
              </li>
            </ol>
          </div>

          {/* Step 3 — the form */}
          <div className="rz-step">
            <div className="rz-step__header">
              <StepBadge n={3} />
              <h3>Paste your API Keys below</h3>
            </div>
            <form className="rz-connect-form" onSubmit={handleSubmit}>
              <label className="rz-connect-form__label">
                <span>Razorpay Key ID *</span>
                <input
                  type="text"
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder="rzp_test_xxxxxxxxxxxx"
                  autoComplete="off"
                  spellCheck="false"
                  className="rz-connect-form__input"
                  required
                />
              </label>

              <label className="rz-connect-form__label" style={{ marginTop: "12px" }}>
                <span>Razorpay Key Secret *</span>
                <input
                  type="password"
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                  placeholder="Paste Key Secret here"
                  autoComplete="off"
                  spellCheck="false"
                  className="rz-connect-form__input"
                  required
                />
              </label>

              <label className="rz-connect-form__label" style={{ marginTop: "12px" }}>
                <span>Razorpay Webhook Secret *</span>
                <input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Paste the secret from Razorpay Webhooks"
                  autoComplete="new-password"
                  spellCheck="false"
                  className="rz-connect-form__input"
                  required
                />
              </label>

              {error && (
                <p className="rz-error" role="alert">
                  {error}
                </p>
              )}

              <div className="rz-connect-form__actions">
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={saving}
                >
                  {saving ? "Verifying & Connecting…" : "Save & Connect"}
                </button>
                <button
                  type="button"
                  className="rz-cancel-btn"
                  onClick={() => {
                    setOpen(false);
                    setKeyId("");
                    setKeySecret("");
                    setWebhookSecret("");
                    setError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="rz-onboarding-footer">
        <span>🔒</span>
        <p>
          Your Key Secret is stored only on the backend and is never returned
          to the browser. Configure the production webhook separately in your
          Razorpay Dashboard. Payments settle directly to your linked bank
          account.
        </p>
      </div>
    </div>
  );
};

const ConnectedCard = ({ keyId, onboardedAt, onDisconnect }) => {
  const [confirming, setConfirming] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");

  const handleDisconnect = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    try {
      setDisconnecting(true);
      await disconnectRazorpay();
      onDisconnect();
    } catch (err) {
      setError(err.message || "Failed to disconnect. Please try again.");
      setDisconnecting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="rz-connected-card">
      <div className="rz-connected-card__header">
        <div className="rz-connected-card__logo">₹</div>
        <div className="rz-connected-card__info">
          <div className="rz-connected-badge">
            <span className="rz-connected-badge__dot" />
            Razorpay Connected
          </div>
          <p className="rz-connected-card__keyid">{maskKeyId(keyId)}</p>
          {onboardedAt && (
            <p className="rz-connected-card__date">
              Connected on {formatDate(onboardedAt)}
            </p>
          )}
        </div>
      </div>

      <div className="rz-connected-card__status-list">
        <p className="rz-status-item rz-status-item--ok">
          Customers can pay via UPI, cards, net banking, and wallets
        </p>
        <p className="rz-status-item rz-status-item--ok">
          Payments settle directly to your Razorpay bank account
        </p>
        <p className="rz-status-item rz-status-item--ok">
          Order status updates automatically after each payment
        </p>
      </div>

      {error && (
        <p className="rz-error" role="alert">
          {error}
        </p>
      )}

      <div className="rz-connected-card__actions">
        <a
          href="https://dashboard.razorpay.com"
          target="_blank"
          rel="noopener noreferrer"
          className="rz-link rz-link--external"
        >
          View Razorpay Dashboard →
        </a>
        <button
          className={`rz-disconnect-btn${confirming ? " rz-disconnect-btn--confirm" : ""}`}
          onClick={handleDisconnect}
          disabled={disconnecting}
        >
          {disconnecting
            ? "Disconnecting…"
            : confirming
            ? "Are you sure? Click again to confirm"
            : "Disconnect"}
        </button>
      </div>

      {confirming && (
        <p className="rz-disconnect-warning">
          Disconnecting will stop customers from paying online until you
          reconnect. This does not affect orders already placed.
        </p>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const PaymentSettings = () => {
  const [settings, setSettings] = useState(null); // { keyId, onboarded, onboardedAt }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
          setSettings({
            keyId: data.keyId || "",
            onboarded: data.onboarded || false,
            onboardedAt: data.onboardedAt || null,
          });
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message || "Could not load payment settings.");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    load();
  }, []);

  const handleConnect = (data) => {
    setSettings({
      keyId: data.keyId,
      onboarded: data.onboarded,
      onboardedAt: data.onboardedAt,
    });
  };

  const handleDisconnect = () => {
    setSettings({ keyId: "", onboarded: false, onboardedAt: null });
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

        <section className="rz-settings-section">
          {loading ? (
            <p className="rz-loading">Loading…</p>
          ) : settings?.onboarded ? (
            <ConnectedCard
              keyId={settings.keyId}
              onboardedAt={settings.onboardedAt}
              onDisconnect={handleDisconnect}
            />
          ) : (
            <OnboardingGuide onConnect={handleConnect} />
          )}

          {/* Go-live tip — always visible */}
          {!loading && (
            <div className="rz-live-tip">
              <strong>Ready to go live?</strong> Once you&rsquo;ve completed
              Razorpay&rsquo;s KYC, generate a{" "}
              <code className="rz-code">rzp_live_</code> key from your Razorpay
              dashboard and replace the test key above. No code changes needed.
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
};

export default PaymentSettings;
