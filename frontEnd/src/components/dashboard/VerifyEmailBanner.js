import { useState } from "react";

import { useAuth } from "../../context/AuthContext.js";
import { resendVerificationEmail } from "../../services/authService.js";

const VerifyEmailBanner = () => {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    try {
      setSending(true);
      await resendVerificationEmail(user.email);
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="verify-email-banner">
      {sent ? (
        <span>Verification email sent — check your inbox.</span>
      ) : (
        <>
          <span>Please verify your email address to unlock automated store approval.</span>

          <button
            type="button"
            className="button button--ghost button--small"
            onClick={handleResend}
            disabled={sending}
          >
            {sending ? "Sending..." : "Resend email"}
          </button>
        </>
      )}
    </div>
  );
};

export default VerifyEmailBanner;
