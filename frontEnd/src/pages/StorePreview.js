import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getMyStorefrontPreview } from "../services/storefrontService.js";
import { resolveAssetUrl } from "../services/api.js";
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

const getCartKey = (slug) => `tenantcart_cart_${slug}`;

const StorePreview = () => {
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [cartOpen, setCartOpen] = useState(false);
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

        const storedCart = sessionStorage.getItem(getCartKey(data.store.slug));
        if (storedCart) {
          try {
            setCart(JSON.parse(storedCart));
          } catch {
            setCart({});
          }
        }
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
  const productCategories = [
    ...new Set(products.map((product) => product.category).filter(Boolean)),
  ];
  const filteredProducts = products
    .filter((product) => (
      activeCategory === "all" || product.category === activeCategory
    ))
    .sort((firstProduct, secondProduct) => {
      if (sortBy === "price-low") return firstProduct.price - secondProduct.price;
      if (sortBy === "price-high") return secondProduct.price - firstProduct.price;
      if (sortBy === "name") return firstProduct.name.localeCompare(secondProduct.name);
      return 0;
    });
  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const persistCart = (nextCart) => {
    setCart(nextCart);
    sessionStorage.setItem(getCartKey(store.slug), JSON.stringify(nextCart));
  };

  const addToCart = (product) => {
    const existing = cart[product._id];
    persistCart({
      ...cart,
      [product._id]: {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: (existing?.quantity || 0) + 1,
      },
    });
  };

  const removeFromCart = (productId) => {
    const nextCart = { ...cart };
    delete nextCart[productId];
    persistCart(nextCart);
  };

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

      <header className={`site-header storefront-site-header storefront-site-header--${theme.components.headerStyle || "centered"}`}>
        <nav className="site-nav">
          <Link to="/dashboard" className="site-logo">Tenant<span>Cart</span></Link>
          <div className="store-preview-nav-actions">
            <Link to="/dashboard" className="store-preview-nav-link">Back to dashboard</Link>
            <button
              type="button"
              className="store-preview-cart-count"
              aria-expanded={cartOpen}
              onClick={() => setCartOpen((isOpen) => !isOpen)}
            >
              Cart ({cartItems.length})
            </button>
          </div>
        </nav>
      </header>

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
            <div className="storefront-products-toolbar">
              {theme.components.showFeaturedProducts && (
                <h2 className="storefront-products-heading">Featured products</h2>
              )}
              <label className="storefront-sort-control">
                <span>Sort by</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="name">Name</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </label>
            </div>
            {productCategories.length > 0 && (
              <nav className="storefront-categories" aria-label="Filter products">
                <button
                  type="button"
                  className={activeCategory === "all" ? "storefront-category storefront-category--active" : "storefront-category"}
                  onClick={() => setActiveCategory("all")}
                >
                  All products
                </button>
                {productCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={activeCategory === category ? "storefront-category storefront-category--active" : "storefront-category"}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </nav>
            )}
            {filteredProducts.length === 0 ? (
              <p className="storefront-empty">No products in this category yet.</p>
            ) : (
            <div className="storefront-grid">
            {filteredProducts.map((product) => (
              <div key={product._id} className={`storefront-card storefront-card--${theme.productCardStyle}`}>
                {product.images?.[0] ? (
                  <img
                    src={resolveAssetUrl(product.images[0])}
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
                  <button
                    type="button"
                    className="dark-button"
                    disabled={product.stock <= 0}
                    onClick={() => addToCart(product)}
                  >
                    {product.stock <= 0 ? "Out of stock" : "Add to cart"}
                  </button>
                </div>
              </div>
            ))}
            </div>
            )}
          </section>
        )}

        <aside className={`storefront-cart${cartOpen ? " storefront-cart--open" : ""}`}>
          <h2>Your cart</h2>
          <button
            type="button"
            className="storefront-cart-close"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
          >
            ×
          </button>
          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cartItems.map((item) => (
                <div key={item.productId} className="storefront-cart-item">
                  <span>{item.name} × {item.quantity}</span>
                  <button type="button" className="text-button" onClick={() => removeFromCart(item.productId)}>
                    Remove
                  </button>
                </div>
              ))}
              <div className="storefront-cart-total">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <button
                type="button"
                className="dark-button large-button"
                onClick={() => navigate(`/store/${store.slug}/checkout`)}
              >
                Checkout
              </button>
            </>
          )}
        </aside>
      </div>

      {store.content?.faqs?.length > 0 && (
        <section className="storefront-faqs">
          <h2>Frequently asked questions</h2>
          {store.content.faqs.map((faq, index) => (
            <details key={index} className="storefront-faq">
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>
      )}

      {(store.policies?.refundPolicy || store.policies?.shippingPolicy ||
        store.policies?.cancellationPolicy || store.policies?.privacyPolicy ||
        store.policies?.termsOfService) && (
        <footer className="storefront-policies">
          {[
            ["shippingPolicy", "Shipping policy"],
            ["refundPolicy", "Refund policy"],
            ["cancellationPolicy", "Cancellation policy"],
            ["privacyPolicy", "Privacy policy"],
            ["termsOfService", "Terms of service"],
          ].map(([key, label]) => store.policies[key] && (
            <details key={key}>
              <summary>{label}</summary>
              <p>{store.policies[key]}</p>
            </details>
          ))}
        </footer>
      )}
    </div>
  );
};

export default StorePreview;
