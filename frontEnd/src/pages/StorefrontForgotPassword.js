import { useState } from "react";

import { Link } from "react-router-dom";

import { customerForgotPassword } from "../services/storefrontCustomerService.js";

import "./Auth.css";
import "./StorefrontAuth.css";

/**
 * Storefront forgot-password page — /store/:slug/forgot-password
 *
 * Sends a password-reset link scoped to this store's slug.
 * The backend deliberately returns the same message regardless of whether the
 * email is registered, to avoid user enumeration.
 */
const StorefrontForgotPassword = ({ slug, storeName }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await customerForgotPassword(slug, email.trim().toLowerCase());
      setMessage(
        data.message ||
          "If an account exists for this email, a reset link has been sent."
      );
    } catch (err) {
      setError(err.message || "Unable to process this request");
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
            <h2>Reset password</h2>
            <p>
              Enter the email address associated with your {storeName} account and
              we'll send a reset link.
            </p>
          </div>

          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}

          {message && (
            <p className="auth-success" role="status">{message}</p>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Sending link…" : "Send reset link"}
            </button>
          </form>

          <p className="auth-footer">
            Remembered it?{" "}
            <Link to={`/store/${slug}/account`}>Sign in</Link>
          </p>

          <p className="storefront-auth-back">
            <Link to={`/store/${slug}`}>← Back to store</Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default StorefrontForgotPassword;
