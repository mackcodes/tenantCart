import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCustomerAuth } from "../context/CustomerAuthContext.js";
import {
  customerLogin,
  customerRegister,
} from "../services/storefrontCustomerService.js";

import "./Auth.css";
import "./StorefrontAuth.css";

/**
 * Combined login/register page for shoppers at a specific store.
 * Mounted at /store/:slug/account
 *
 * The slug-scoped API calls ensure tokens/cookies are always bound to this
 * store and cannot be used against any other tenant's storefront.
 */
const StorefrontLogin = ({ slug, storeName }) => {
  const { setCustomer } = useCustomerAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await customerLogin(slug, {
        email: form.email,
        password: form.password,
      });
      setCustomer(data.customer);
      navigate(`/store/${slug}/my-orders`, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await customerRegister(slug, {
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setCustomer(data.customer);
      setSuccess(
        data.emailSent
          ? "Account created! Check your inbox to verify your email."
          : "Account created! You can now view your orders."
      );
      setTimeout(() => navigate(`/store/${slug}/my-orders`, { replace: true }), 1500);
    } catch (err) {
      setError(err.message || "Unable to create account");
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
            <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
            <p>
              {mode === "login"
                ? `Sign in to your ${storeName} account to view your orders.`
                : `Create a ${storeName} account to track your orders.`}
            </p>
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="auth-success" role="status">
              {success}
            </p>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="auth-form">
              <label className="auth-field">
                <span>Email address</span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                />
              </label>

              <div className="auth-forgot-row">
                <Link to={`/store/${slug}/forgot-password`}>
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <label className="auth-field">
                <span>Full name</span>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Email address</span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Confirm password</span>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                />
              </label>

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}

          <p className="auth-footer">
            {mode === "login" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  className="auth-footer-toggle"
                  onClick={() => { setMode("register"); setError(""); }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="auth-footer-toggle"
                  onClick={() => { setMode("login"); setError(""); }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="storefront-auth-back">
            <Link to={`/store/${slug}`}>← Back to store</Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default StorefrontLogin;
