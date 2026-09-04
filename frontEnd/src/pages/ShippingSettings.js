import { useEffect, useState } from "react";

import DashboardLayout from "../components/dashboard/DashboardLayout.js";
import {
  getShippingSettings,
  saveShippingSettings,
} from "../services/shippingService.js";

const defaultShipping = {
  flatRate: "0",
  freeShippingThreshold: "1000",
  localPickupEnabled: false,
  estimatedDelivery: "3-5 business days",
};

const ShippingSettings = () => {
  const [shipping, setShipping] = useState(defaultShipping);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getShippingSettings();
        setShipping({
          ...defaultShipping,
          ...data.shipping,
          flatRate: String(data.shipping?.flatRate ?? defaultShipping.flatRate),
          freeShippingThreshold: String(
            data.shipping?.freeShippingThreshold ?? defaultShipping.freeShippingThreshold
          ),
        });
      } catch (requestError) {
        setError(requestError.message || "Unable to load shipping settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setShipping((currentShipping) => ({
      ...currentShipping,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (Number(shipping.flatRate) < 0 || Number(shipping.freeShippingThreshold) < 0) {
      setError("Shipping amounts cannot be negative.");
      return;
    }

    if (!shipping.estimatedDelivery.trim()) {
      setError("Estimated delivery is required.");
      return;
    }

    try {
      setSaving(true);
      const data = await saveShippingSettings({
        flatRate: Number(shipping.flatRate),
        freeShippingThreshold: Number(shipping.freeShippingThreshold),
        localPickupEnabled: shipping.localPickupEnabled,
        estimatedDelivery: shipping.estimatedDelivery.trim(),
      });
      setShipping((currentShipping) => ({
        ...currentShipping,
        ...data.shipping,
        flatRate: String(data.shipping.flatRate),
        freeShippingThreshold: String(data.shipping.freeShippingThreshold),
      }));
      setNotice("Shipping settings saved successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save shipping settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="merchant-products shipping-settings">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Shipping settings</h1>
            <p className="page-heading__description">
              Set the delivery charge customers see at checkout.
            </p>
          </div>
        </section>

        {error && <p className="form-message form-message--error" role="alert">{error}</p>}
        {notice && <p className="form-message form-message--success" role="status">{notice}</p>}

        <section className="shipping-settings-card">
          {loading ? (
            <p>Loading shipping settings...</p>
          ) : (
            <form className="shipping-settings-form" onSubmit={handleSubmit}>
              <div className="shipping-settings-form__intro">
                <h2>Standard delivery</h2>
                <p>
                  Orders at or above the free-shipping threshold receive free
                  delivery. Smaller orders use the flat rate below.
                </p>
              </div>

              <div className="shipping-settings-grid">
                <label>
                  Flat delivery rate (INR)
                  <input
                    name="flatRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={shipping.flatRate}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Free shipping over (INR)
                  <input
                    name="freeShippingThreshold"
                    type="number"
                    min="0"
                    step="0.01"
                    value={shipping.freeShippingThreshold}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              <label>
                Estimated delivery
                <input
                  name="estimatedDelivery"
                  type="text"
                  maxLength="80"
                  value={shipping.estimatedDelivery}
                  onChange={handleChange}
                  placeholder="3-5 business days"
                  required
                />
              </label>

              <label className="shipping-checkbox">
                <input
                  name="localPickupEnabled"
                  type="checkbox"
                  checked={shipping.localPickupEnabled}
                  onChange={handleChange}
                />
                <span>
                  <strong>Offer local pickup</strong>
                  <small>Customers can collect orders without a delivery charge.</small>
                </span>
              </label>

              <button type="submit" className="button button--primary" disabled={saving}>
                {saving ? "Saving..." : "Save shipping settings"}
              </button>
            </form>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
};

export default ShippingSettings;