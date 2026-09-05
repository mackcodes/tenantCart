import { useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.js";
import { useAuth } from "../context/AuthContext.js";

const Growth = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const storeUrl = user?.tenant?.slug
    ? `${window.location.protocol}//${window.location.host}/store/${user.tenant.slug}`
    : "";

  const handleCopy = () => {
    if (!storeUrl) return;
    navigator.clipboard.writeText(storeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareText = encodeURIComponent(
    `Check out my store${user?.tenant?.storeName ? ` ${user.tenant.storeName}` : ""}: `
  );
  const encodedUrl = encodeURIComponent(storeUrl);

  return (
    <DashboardLayout>
      <main className="account-settings">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Marketing</p>
            <h1>Growth</h1>
            <p className="page-heading__description">
              Share your store and attract new customers.
            </p>
          </div>
        </section>

        <section className="settings-panel">
          <div className="settings-panel__header">
            <div>
              <h2>Your store link</h2>
              <p>Share this link to send customers directly to your store.</p>
            </div>
          </div>
          {!storeUrl ? (
            <p>Create a store first to get your shareable link.</p>
          ) : (
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "12px" }}>
              <input
                type="text"
                readOnly
                value={storeUrl}
                style={{ flex: 1, minWidth: "200px" }}
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                className="button button--secondary"
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          )}
        </section>

        <section className="settings-panel">
          <h2>Share on social media</h2>
          <p>Spread the word about your store on your favourite platforms.</p>
          {storeUrl ? (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
              <a
                href={`https://wa.me/?text=${shareText}${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--secondary"
              >
                Share on WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--secondary"
              >
                Share on X (Twitter)
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--secondary"
              >
                Share on Facebook
              </a>
            </div>
          ) : (
            <p style={{ marginTop: "12px" }}>Create a store first to share on social media.</p>
          )}
        </section>

        <section className="settings-panel">
          <h2>Growth tips</h2>
          <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
            <li>Add high-quality product photos to increase buyer confidence.</li>
            <li>Use discount codes to drive your first orders and reward loyal customers.</li>
            <li>Enable free shipping above a threshold to increase average cart size.</li>
            <li>Write a clear store description so customers know what makes you unique.</li>
            <li>Ask happy customers to share your store link with friends and family.</li>
          </ul>
        </section>
      </main>
    </DashboardLayout>
  );
};

export default Growth;
