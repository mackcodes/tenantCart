import { useEffect, useState } from "react";

import { getMyStorefrontPreview } from "../services/storefrontService.js";
import { getStorefrontTheme } from "../utils/storefrontTheme.js";

import "./LandingPage.css";
import "./Storefront.css";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const StorePreview = () => {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMyStorefrontPreview();

        setStore(data.store);
        setProducts(data.products || []);
      } catch (requestError) {
        setError(
          requestError.message || "Unable to load your storefront preview"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="minimal-landing">
        <p className="storefront-empty">Loading your storefront...</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="minimal-landing">
        <p className="storefront-empty">{error || "Store not found"}</p>
      </div>
    );
  }

  const theme = getStorefrontTheme(store);

  return (
    <div
      className={`minimal-landing storefront-theme storefront-theme--${theme.layout}`}
      style={theme.style}
    >
      {store.status !== "approved" && (
        <p className="form-message form-message--error" style={{ margin: "24px auto 0", width: "min(1180px, calc(100% - 56px))" }}>
          This is a preview only — your store isn't approved yet, so customers
          can't see it or place orders until an admin approves it.
        </p>
      )}

      {theme.components.showBanner && (
        <p className="storefront-banner">Free shipping on orders over ₹1,000</p>
      )}

      <section className="storefront-header">
        <p className="eyebrow">{store.category}</p>
        <h1>{store.storeName}</h1>
        <p>{store.description}</p>
      </section>

      <div className="storefront-layout">
        {products.length === 0 ? (
          <p className="storefront-empty">
            You haven't added any products yet.
          </p>
        ) : (
          <section className="storefront-products-section">
            {theme.components.showFeaturedProducts && <h2 className="storefront-products-heading">Featured products</h2>}
            <div className="storefront-grid">
            {products.map((product) => (
              <div key={product._id} className={`storefront-card storefront-card--${theme.productCardStyle}`}>
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt=""
                    className="storefront-card__image"
                  />
                ) : (
                  <div className="storefront-card__placeholder">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="storefront-card__body">
                  <h3>{product.name}</h3>
                  <p className="storefront-card__price">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default StorePreview;
