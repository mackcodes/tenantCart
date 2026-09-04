import React, { useState } from "react";
import { Link } from "react-router-dom";

import { resendVerificationEmail } from "../services/authService.js";

import "./Auth.css";

function ResendVerification() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await resendVerificationEmail(email.trim());
        if (!data.emailSent) {
          throw new Error(
            data.message || "Unable to send the verification email"
          );
        }
        setMessage(data.message || "Verification email sent");
    } catch (requestError) {
      setError(requestError.message || "Unable to resend the verification email");
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
          <p className="auth-eyebrow">Email verification</p>

          <h1>
            Need a new
            <br />
            <em>verification link?</em>
          </h1>

          <p>
            Enter your account email and we will send a fresh verification link
            if your account still needs one.
          </p>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2>Resend verification</h2>

            <p>Use the email address associated with your TenantCart account.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <p className="auth-error" role="alert">{error}</p>}

            {message && <p className="auth-success" role="status">{message}</p>}

            <label className="auth-field">
              <span>Email address</span>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="auth-input"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Sending link..." : "Resend verification link"}
            </button>
          </form>

          <p className="auth-footer">
            Already verified? <Link to="/login">Log in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default ResendVerification;