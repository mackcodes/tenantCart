import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.js";

import "./Auth.css";

function AdminLogin() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, logout } = useAuth();
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
    setLoading(true);

    try {
      const data = await login(form.email, form.password);

      if (data.user?.role !== "admin") {
        await logout();
        setError("This account does not have admin access");
        return;
      }

      navigate("/dashboard/admin/tenants", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to log in");
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
          <p className="auth-eyebrow">Admin console</p>

          <h1>
            Review and
            <br />
            <em>approve stores.</em>
          </h1>

          <p>
            Sign in with an administrator account to review merchant
            applications and manage tenant status.
          </p>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2>Admin log in</h2>

            <p>This area is restricted to administrators.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <label className="auth-field">
              <span>Email address</span>

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="auth-input"
                placeholder="admin@example.com"
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

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in to admin console"}
            </button>
          </form>

          <p className="auth-footer">
            Not an admin? <Link to="/login">Go to merchant login</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default AdminLogin;
