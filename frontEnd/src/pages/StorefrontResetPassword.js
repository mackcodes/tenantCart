import { useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { customerResetPassword } from "../services/storefrontCustomerService.js";

import "./Auth.css";
import "./StorefrontAuth.css";

/**
 * Storefront reset-password page — /store/:slug/reset-password/:token
 *
 * The token and slug both come from URL params — slug is available via the
 * parent route, token from this route's :token segment.
 */
const StorefrontResetPassword = ({ slug, storeName }) => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This password-reset link is invalid.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await customerResetPassword(slug, token, {
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      // Navigate to the account/login page with a success flag so the login
      // form can show a confirmation message.
      navigate(`/store/${slug}/account`, {
        replace: true,
        state: { resetSuccess: true },
      });
    } catch (err) {
      setError(err.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page storefront-auth-page">
      <Link to={`/store/${slug}`} className="auth-brand">
        {storeName || "Store"}
      </Link>

      <div className="auth-shell storefront-auth-shell">
        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2>Set new password</h2>
            <p>Choose a new password for your {storeName} account.</p>
          </div>

          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span>New password</span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="auth-input"
                placeholder="At least 8 characters"
                minLength="8"
                autoComplete="new-password"
                required
              />
            </label>

            <label className="auth-field">
              <span>Confirm new password</span>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="auth-input"
                placeholder="Repeat your new password"
                minLength="8"
                autoComplete="new-password"
                required
              />
            </label>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Resetting…" : "Reset password"}
            </button>
          </form>

          <p className="auth-footer">
            <Link to={`/store/${slug}/account`}>Back to sign in</Link>
          </p>

          <p className="storefront-auth-back">
            <Link to={`/store/${slug}`}>← Back to store</Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default StorefrontResetPassword;
