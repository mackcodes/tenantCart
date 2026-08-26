import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { verifyEmail } from "../services/authService.js";

import "./Auth.css";

function VerifyEmail() {
  const { token } = useParams();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const data = await verifyEmail(token);

        setMessage(data.message || "Email verified successfully");
        setStatus("success");
      } catch (error) {
        setMessage(error.message || "Unable to verify email");
        setStatus("error");
      }
    };

    run();
  }, [token]);

  return (
    <main className="auth-page">
      <Link to="/" className="auth-brand">
        Tenant<span>Cart</span>
      </Link>

      <div className="auth-shell">
        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2>Email verification</h2>
          </div>

          <div className="auth-form">
            {status === "verifying" && <p>Verifying your email...</p>}

            {status === "success" && (
              <>
                <p className="auth-success">{message}</p>

                <Link to="/login" className="auth-submit">
                  Continue to log in
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <p className="auth-error" role="alert">
                  {message}
                </p>

                <Link to="/login" className="auth-submit">
                  Back to log in
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default VerifyEmail;
