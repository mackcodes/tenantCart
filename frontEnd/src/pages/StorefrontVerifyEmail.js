import { useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import { verifyCustomerEmail } from "../services/storefrontCustomerService.js";

import "./Auth.css";
import "./StorefrontAuth.css";

/**
 * Storefront email-verification page — /store/:slug/verify-email/:token
 *
 * Automatically calls the verification endpoint when the page mounts.
 * The slug is available as a prop (passed by the CustomerStoreLayout wrapper)
 * and the token comes from the route's :token segment.
 */
const StorefrontVerifyEmail = ({ slug, storeName }) => {
  const { token } = useParams();

  const [status, setStatus] = useState("loading"); // "loading" | "success" | "already" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || !slug) {
      setStatus("error");
      setMessage("This verification link is invalid or has expired.");
      return;
    }

    let cancelled = false;

    verifyCustomerEmail(slug, token)
      .then((data) => {
        if (cancelled) return;
        setStatus(data.alreadyVerified ? "already" : "success");
        setMessage(
          data.message ||
            (data.alreadyVerified
              ? "Your email was already verified."
              : "Email verified successfully!")
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err.message || "This verification link is invalid or has expired.");
      });

    return () => {
      cancelled = true;
    };
  }, [slug, token]);

  const isSuccess = status === "success" || status === "already";

  return (
    <main className="auth-page storefront-auth-page">
      <Link to={`/store/${slug}`} className="auth-brand">
        {storeName || "Store"}
      </Link>

      <div className="auth-shell storefront-auth-shell">
        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2>Email verification</h2>
            <p>Verifying your email address for your {storeName} account.</p>
          </div>

          {status === "loading" && (
            <p
              className="verify-email-status"
              style={{ color: "#68756d" }}
            >
              Verifying your email…
            </p>
          )}

          {status !== "loading" && (
            <p
              className={isSuccess ? "auth-success verify-email-status" : "auth-error verify-email-status"}
              role={isSuccess ? "status" : "alert"}
            >
              {message}
            </p>
          )}

          {isSuccess && (
            <p className="auth-footer">
              <Link to={`/store/${slug}/account`}>Sign in to your account →</Link>
            </p>
          )}

          {status === "error" && (
            <p className="auth-footer">
              <Link to={`/store/${slug}/account`}>Back to sign in</Link>
            </p>
          )}

          <p className="storefront-auth-back">
            <Link to={`/store/${slug}`}>← Back to store</Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default StorefrontVerifyEmail;
