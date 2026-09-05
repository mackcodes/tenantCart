import { useEffect, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.js";
import { useAuth } from "../context/AuthContext.js";
import { getMarkets, saveMarkets } from "../services/marketsService.js";

const CURRENCIES = [
  { code: "INR", label: "Indian Rupee (INR)" },
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "SGD", label: "Singapore Dollar (SGD)" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "mr", label: "Marathi" },
  { code: "bn", label: "Bengali" },
];

const TIMEZONES = [
  { code: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { code: "Asia/Dubai", label: "Gulf Standard Time (GST)" },
  { code: "Asia/Singapore", label: "Singapore Time (SGT)" },
  { code: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { code: "America/New_York", label: "Eastern Time (ET)" },
  { code: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { code: "UTC", label: "Coordinated Universal Time (UTC)" },
];

const defaultMarkets = {
  currency: "INR",
  language: "en",
  timezone: "Asia/Kolkata",
};

const Markets = () => {
  const { user } = useAuth();
  const [markets, setMarkets] = useState(defaultMarkets);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  const storeUrl = user?.tenant?.slug
    ? `${window.location.origin}/store/${user.tenant.slug}`
    : "";

  const handleCopyStoreUrl = async () => {
    if (!storeUrl) return;

    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy the store link. Please select it manually.");
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getMarkets();
        setMarkets({ ...defaultMarkets, ...data.markets });
      } catch (requestError) {
        setError(requestError.message || "Unable to load market settings.");
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setMarkets((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const data = await saveMarkets(markets);
      setMarkets({ ...defaultMarkets, ...data.markets });
      setNotice("Market settings saved successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save market settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="merchant-products shipping-settings">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Store</p>
            <h1>Markets</h1>
            <p className="page-heading__description">
              Configure the currency, language, and timezone for your storefront.
            </p>
          </div>
        </section>

        {error && <p className="form-message form-message--error" role="alert">{error}</p>}
        {notice && <p className="form-message form-message--success" role="status">{notice}</p>}

        <section className="shipping-settings-card" style={{ marginBottom: "24px" }}>
          <div className="shipping-settings-form__intro">
            <h2>Your storefront link</h2>
            <p>Copy this full website link and share it with your customers.</p>
          </div>

          {storeUrl ? (
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="url"
                value={storeUrl}
                readOnly
                aria-label="Full storefront website link"
                onFocus={(event) => event.target.select()}
                style={{ flex: "1 1 320px" }}
              />
              <button
                type="button"
                className="button button--secondary"
                onClick={handleCopyStoreUrl}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--secondary"
              >
                View store
              </a>
            </div>
          ) : (
            <p>Your storefront link will appear after your store address is set.</p>
          )}
        </section>

        <section className="shipping-settings-card">
          {loading ? (
            <p>Loading market settings...</p>
          ) : (
            <form className="shipping-settings-form" onSubmit={handleSubmit}>
              <div className="shipping-settings-form__intro">
                <h2>Regional settings</h2>
                <p>
                  These settings affect how prices, dates, and text are displayed
                  on your storefront.
                </p>
              </div>

              <div className="shipping-settings-grid">
                <label>
                  Currency
                  <select name="currency" value={markets.currency} onChange={handleChange}>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Store language
                  <select name="language" value={markets.language} onChange={handleChange}>
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Timezone
                <select name="timezone" value={markets.timezone} onChange={handleChange}>
                  {TIMEZONES.map((t) => (
                    <option key={t.code} value={t.code}>{t.label}</option>
                  ))}
                </select>
              </label>

              <button type="submit" className="button button--primary" disabled={saving}>
                {saving ? "Saving..." : "Save market settings"}
              </button>
            </form>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
};

export default Markets;
