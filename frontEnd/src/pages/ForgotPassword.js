import React, { useState } from "react";

import {
  Link,
} from "react-router-dom";

import {
  forgotPassword,
} from "../services/authService.js";

import "./Auth.css";

function ForgotPassword() {
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
      const data = await forgotPassword(email);

      setMessage(
        data.message ||
          "If an account exists for this email, a reset link has been sent."
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to process this request"
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
            Account recovery
          </p>

          <h1>
            Forgot your
            <br />
            <em>password?</em>
          </h1>

          <p>
            Enter your account email and we will send you
            a secure link to reset your password.
          </p>

          <div className="auth-note">
            <strong>Keep your account secure</strong>
            The reset link expires after a short time and
            can only be used once.
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2>Reset password</h2>

            <p>
              We will send a password-reset link to your
              registered email address.
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

            {message && (
              <p className="auth-success">
                {message}
              </p>
            )}

            <label className="auth-field">
              <span>Email address</span>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="auth-input"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Sending link..."
                : "Send reset link"}
            </button>
          </form>

          <p className="auth-footer">
            Remembered your password?{" "}
            <Link to="/login">
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default ForgotPassword;