import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.js";

import "./Auth.css";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    login,
  } = useAuth();

  const navigate = useNavigate();

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(
        form.email,
        form.password
      );

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to log in"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <Link
        to="/"
        className="auth-brand"
      >
        Tenant<span>Cart</span>
      </Link>

      <div className="auth-shell">
        <section className="auth-introduction">
          <p className="auth-eyebrow">
            Welcome back
          </p>

          <h1>
            Pick up
            <br />
            <em>
              where you left off.
            </em>
          </h1>

          <p>
            Your store, products,
            orders, and business
            insights are waiting for
            you.
          </p>

          <div className="login-highlights">
            <div>
              <span>01</span>
              <p>
                Manage your products
                in one place.
              </p>
            </div>

            <div>
              <span>02</span>
              <p>
                Keep track of every
                customer order.
              </p>
            </div>

            <div>
              <span>03</span>
              <p>
                Make better decisions
                with store insights.
              </p>
            </div>
          </div>

          <div className="auth-note">
            <strong>
              A quiet place to work
            </strong>

            TenantCart keeps the
            everyday parts of running
            your store simple.
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2>Log in</h2>

            <p>
              Enter your details to
              continue to your store.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >
            {error && (
              <p
                className="auth-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <label className="auth-field">
              <span>
                Email address
              </span>

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
              <Link to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Log in to TenantCart"}
            </button>
          </form>

          <p className="auth-footer">
            New to TenantCart?{" "}
            <Link to="/register-account">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default Login;