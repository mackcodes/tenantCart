import React, { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  registerStore,
} from "../services/authService.js";

import { useAuth } from "../context/AuthContext.js";

import "./Auth.css";

const initialForm = {
  storeName: "",
  slug: "",
  description: "",
  category: "other",
  businessEmail: "",
  businessPhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  primaryColor: "#4F46E5",
};

function RegisterStore() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    setUser,
  } = useAuth();

  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;

    let nextValue = value;

    if (name === "slug") {
      nextValue = value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    }

    setForm((previousForm) => ({
      ...previousForm,
      [name]: nextValue,
    }));
  };

  const validateForm = () => {
    if (!form.storeName.trim()) {
      return "Store name is required";
    }

    if (form.storeName.trim().length < 2) {
      return "Store name must contain at least 2 characters";
    }

    if (!form.slug.trim()) {
      return "Store address is required";
    }

    if (!/^[a-z0-9-]+$/.test(form.slug)) {
      return "Store address can contain only lowercase letters, numbers, and hyphens";
    }

    if (form.description.length > 500) {
      return "Description cannot exceed 500 characters";
    }

    if (
      form.businessEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.businessEmail
      )
    ) {
      return "Enter a valid business email";
    }

    if (
      form.businessPhone &&
      !/^[0-9+\-\s()]{7,20}$/.test(
        form.businessPhone
      )
    ) {
      return "Enter a valid business phone number";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const payload = {
      storeName: form.storeName.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      category: form.category,
      businessEmail: form.businessEmail.trim(),
      businessPhone: form.businessPhone.trim(),

      address: {
        line1: form.addressLine1.trim(),
        line2: form.addressLine2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim(),
      },

      branding: {
        primaryColor: form.primaryColor,
        logoUrl: "",
        templateId: "default",
      },
    };

    try {
      console.log(
        "Submitting store registration payload:",
        payload
      );

      const data = await registerStore(payload);

      if (data.user) {
        setUser({
          ...data.user,
          tenant: data.tenant || data.user.tenant,
        });
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch (requestError) {
      console.error(
        "Store registration failed:",
        requestError
      );

      setError(
        requestError.message ||
        "Unable to create your store"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <Link to="/" className="auth-brand">
        Tenant<span>Cart</span>
      </Link>

      <div className="auth-shell">
        <section className="auth-introduction">
          <p className="auth-eyebrow">
            Set up your store
          </p>

          <h1>
            Give your store
            <br />
            <em>a place to belong.</em>
          </h1>

          <p>
            Add your store details so customers can recognize and find your
            business.
          </p>

          <div className="auth-note">
            <strong>A space of your own</strong>
            Your store will have its own identity while TenantCart manages the
            shared platform infrastructure.
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2>Set up your store</h2>

            <p>
              Add the basic information customers will see.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >
            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            <label className="auth-field">
              <span>Store name</span>

              <input
                name="storeName"
                type="text"
                value={form.storeName}
                onChange={handleChange}
                className="auth-input"
                placeholder="Urban Goods"
                minLength="2"
                maxLength="100"
                required
              />
            </label>

            <label className="auth-field">
              <span>Store address</span>

              <input
                name="slug"
                type="text"
                value={form.slug}
                onChange={handleChange}
                className="auth-input"
                placeholder="urban-goods"
                pattern="[a-z0-9-]+"
                title="Use lowercase letters, numbers, and hyphens only"
                required
              />

              <small className="field-help">
                This becomes your store’s unique web address.
              </small>
            </label>

            <label className="auth-field">
              <span>Business category</span>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="auth-input"
                required
              >
                <option value="fashion">
                  Fashion
                </option>

                <option value="electronics">
                  Electronics
                </option>

                <option value="food">
                  Food and beverages
                </option>

                <option value="beauty">
                  Beauty
                </option>

                <option value="home">
                  Home and living
                </option>

                <option value="services">
                  Services
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </label>

            <label className="auth-field">
              <span>Store description</span>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="auth-input auth-textarea"
                placeholder="Tell customers what your store offers"
                maxLength="500"
                rows="4"
              />

              <small className="field-help">
                {form.description.length}/500 characters
              </small>
            </label>

            <div className="auth-two-column">
              <label className="auth-field">
                <span>Business email</span>

                <input
                  name="businessEmail"
                  type="email"
                  value={form.businessEmail}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="hello@yourstore.com"
                  autoComplete="email"
                />
              </label>

              <label className="auth-field">
                <span>Business phone</span>

                <input
                  name="businessPhone"
                  type="tel"
                  value={form.businessPhone}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="+91 9876543210"
                  autoComplete="tel"
                />
              </label>
            </div>

            <label className="auth-field">
              <span>Address line 1</span>

              <input
                name="addressLine1"
                type="text"
                value={form.addressLine1}
                onChange={handleChange}
                className="auth-input"
                placeholder="12 MG Road"
                autoComplete="street-address"
              />
            </label>

            <label className="auth-field">
              <span>Address line 2</span>

              <input
                name="addressLine2"
                type="text"
                value={form.addressLine2}
                onChange={handleChange}
                className="auth-input"
                placeholder="Apartment, floor, or landmark"
              />
            </label>

            <div className="auth-two-column">
              <label className="auth-field">
                <span>City</span>

                <input
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Bengaluru"
                  autoComplete="address-level2"
                />
              </label>

              <label className="auth-field">
                <span>State</span>

                <input
                  name="state"
                  type="text"
                  value={form.state}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Karnataka"
                  autoComplete="address-level1"
                />
              </label>
            </div>

            <div className="auth-two-column">
              <label className="auth-field">
                <span>Postal code</span>

                <input
                  name="postalCode"
                  type="text"
                  value={form.postalCode}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="560001"
                  autoComplete="postal-code"
                />
              </label>

              <label className="auth-field">
                <span>Country</span>

                <input
                  name="country"
                  type="text"
                  value={form.country}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="India"
                  autoComplete="country-name"
                  required
                />
              </label>
            </div>

            <label className="auth-field">
              <span>Brand color</span>

              <div className="color-row">
                <input
                  name="primaryColor"
                  type="color"
                  value={form.primaryColor}
                  onChange={handleChange}
                  className="color-input"
                />

                <input
                  name="primaryColor"
                  type="text"
                  value={form.primaryColor}
                  onChange={handleChange}
                  className="auth-input"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  title="Enter a valid hex color, for example #4F46E5"
                />
              </div>
            </label>

            <div className="store-preview">
              <span className="store-preview-label">
                Your storefront
              </span>

              <p className="store-preview-name">
                {form.storeName || "Your store name"}
              </p>

              <p className="store-preview-url">
                tenantcart.com/
                {form.slug || "your-store"}
              </p>

              <span
                className="color-preview"
                style={{
                  backgroundColor:
                    form.primaryColor,
                }}
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Creating store..."
                : "Create my store"}
            </button>
          </form>

          <p className="auth-footer">
            Need to return?{" "}
            <Link to="/">Back to home</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default RegisterStore;
