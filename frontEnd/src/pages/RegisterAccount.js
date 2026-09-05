import React, { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  registerAccount,
} from "../services/authService.js";

import { useAuth } from "../context/AuthContext.js";

import "./Auth.css";

function RegisterAccount() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();

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

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const data = await registerAccount(form);

      sessionStorage.setItem("tenantcart_verification_email", form.email.trim().toLowerCase());
      setUser(data.user);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      setError(
        error.message || "Unable to create account"
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
            A good place to begin
          </p>

          <h1>
            Make room for
            <br />
            <em>your ideas.</em>
          </h1>

          <p>
            Create your account to get started. You can set up your
            store whenever you're ready.
          </p>

          <div className="auth-note">
            <strong>Your store starts here</strong>
            A name, a point of view, and the things you want to share with the
            world.
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2>Create an account</h2>
            <p>
              Tell us a little about yourself.
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
              <span>Your name</span>

              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="auth-input"
                placeholder="Mayank Kumar"
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
                minLength="8"
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
                minLength="8"
                required
              />
            </label>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create account"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login">Log in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default RegisterAccount;
