import React, { useState } from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  resetPassword,
} from "../services/authService.js";

import "./Auth.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!token) {
      setError(
        "This password reset link is invalid."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError(
        "Password must be at least 8 characters"
      );
      return;
    }

    setLoading(true);

    try {
      await resetPassword(
        token,
        form.password,
        form.confirmPassword
      );

      navigate("/login", {
        replace: true,
        state: {
          resetSuccess: true,
        },
      });
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to reset password"
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
            Almost done
          </p>

          <h1>
            Choose a new
            <br />
            <em>password.</em>
          </h1>

          <p>
            Enter a new password for your TenantCart
            account.
          </p>

          <div className="auth-note">
            <strong>Reset link expiry</strong>
            This link is valid for 15 minutes and can only
            be used once.
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2>Set new password</h2>

            <p>
              Enter and confirm your new password below.
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

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Resetting..."
                : "Reset password"}
            </button>
          </form>

          <p className="auth-footer">
            <Link to="/login">
              Back to login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default ResetPassword;