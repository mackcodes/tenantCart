import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { getStorefront } from "../services/storefrontService.js";
import { resolveAssetUrl } from "../services/api.js";
import { getStorefrontTheme } from "../utils/storefrontTheme.js";
import {
  CustomerAuthProvider,
  useCustomerAuth,
} from "../context/CustomerAuthContext.js";

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

/**
 * Thin account-nav widget rendered inside the storefront header.
 * Shows "My orders" when a customer session exists, otherwise "Sign in".
 * Safe to render even when CustomerAuthProvider is still loading.
 */
const AccountNav = ({ slug }) => {
  const { customer, loading } = useCustomerAuth();

  if (loading) return null;

  return (
    <Link
      to={customer ? `/store/${slug}/my-orders` : `/store/${slug}/account`}
      style={{
        fontSize: "13px",
        fontWeight: 700,
        color: "inherit",
        textDecoration: "none",
        opacity: 0.75,
      }}
    >
      {customer ? "My orders" : "Sign in"}
    </Link>
  );
};

const StorefrontInner = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const loadStore = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getStorefront(slug);

        setStore(data.store);
        setProducts(data.products || []);
      } catch (requestError) {
        setError(
          requestError.message || "This store could not be found"
        );
      } finally {
        setLoading(false);
      }
    };

    loadStore();

    const storedCart = sessionStorage.getItem(getCartKey(slug));

    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (parseError) {
        setCart({});
      }
    }
  }, [slug]);

  const persistCart = (nextCart) => {
    setCart(nextCart);
    sessionStorage.setItem(getCartKey(slug), JSON.stringify(nextCart));
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

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const theme = getStorefrontTheme(store);
  const productCategories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  const visibleProducts = activeCategory === "all"
    ? products
    : products.filter((product) => product.category === activeCategory);

  if (loading) {
    return (
      <div className="minimal-landing">
        <p className="storefront-empty">Loading store...</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="minimal-landing">
        <p className="storefront-empty">
          {error || "Store not found"}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`minimal-landing storefront-theme storefront-theme--${theme.layout}`}
      style={theme.style}
    >
      <header className={`site-header storefront-site-header storefront-site-header--${theme.components.headerStyle || "centered"}`}>
        <nav className="site-nav">
          <Link to="/" className="site-logo">
            Tenant<span>Cart</span>
          </Link>
          <div className="storefront-header-actions">
            <AccountNav slug={slug} />
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

      {store.content?.banners?.length > 0 && (
        <section className="storefront-promo-banners">
          {store.content.banners.map((banner, index) => (
            <a
              key={index}
              href={banner.link || undefined}
              className="storefront-promo-banner"
              style={banner.imageUrl ? { backgroundImage: `url(${resolveAssetUrl(banner.imageUrl)})` } : undefined}
            >
              <div className="storefront-promo-banner__text">
                {banner.title && <h3>{banner.title}</h3>}
                {banner.subtitle && <p>{banner.subtitle}</p>}
              </div>
            </a>
          ))}
        </section>
      )}

      <section className="storefront-header">
        <p className="eyebrow">{store.category}</p>
        <h1>{store.storeName}</h1>
        <p>{store.description}</p>
      </section>

      {theme.components.showCategories && productCategories.length > 0 && (
        <nav className="storefront-categories" aria-label="Product categories">
          <button
            type="button"
            className={activeCategory === "all" ? "storefront-category storefront-category--active" : "storefront-category"}
            onClick={() => setActiveCategory("all")}
          >
            All products
          </button>
          {productCategories.map((productCategory) => (
            <button
              key={productCategory}
              type="button"
              className={activeCategory === productCategory ? "storefront-category storefront-category--active" : "storefront-category"}
              onClick={() => setActiveCategory(productCategory)}
            >
              {productCategory}
            </button>
          ))}
        </nav>
      )}

      <div className="storefront-layout">
        {visibleProducts.length === 0 ? (
          <p className="storefront-empty">
            {products.length === 0 ? "This store hasn't added any products yet." : "No products in this category yet."}
          </p>
        ) : (
          <section className="storefront-products-section">
            {theme.components.showFeaturedProducts && <h2 className="storefront-products-heading">Featured products</h2>}
            <div className="storefront-grid">
            {visibleProducts.map((product) => (
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
                  <span>
                    {item.name} × {item.quantity}
                  </span>

                  <button
                    type="button"
                    className="text-button"
                    onClick={() => removeFromCart(item.productId)}
                  >
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
                onClick={() => navigate(`/store/${slug}/checkout`)}
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

      {(store.policies?.refundPolicy ||
        store.policies?.shippingPolicy ||
        store.policies?.cancellationPolicy ||
        store.policies?.privacyPolicy ||
        store.policies?.termsOfService) && (
        <footer className="storefront-policies">
          {store.policies.shippingPolicy && (
            <details><summary>Shipping policy</summary><p>{store.policies.shippingPolicy}</p></details>
          )}
          {store.policies.refundPolicy && (
            <details><summary>Refund policy</summary><p>{store.policies.refundPolicy}</p></details>
          )}
          {store.policies.cancellationPolicy && (
            <details><summary>Cancellation policy</summary><p>{store.policies.cancellationPolicy}</p></details>
          )}
          {store.policies.privacyPolicy && (
            <details><summary>Privacy policy</summary><p>{store.policies.privacyPolicy}</p></details>
          )}
          {store.policies.termsOfService && (
            <details><summary>Terms of service</summary><p>{store.policies.termsOfService}</p></details>
          )}
        </footer>
      )}
    </div>
  );
};

/**
 * Public-facing wrapper — provides a CustomerAuthProvider so the AccountNav
 * inside StorefrontInner can read the customer session without requiring the
 * full storefront to be wrapped elsewhere in the tree.
 */
const Storefront = () => {
  const { slug } = useParams();
  return (
    <CustomerAuthProvider slug={slug}>
      <StorefrontInner />
    </CustomerAuthProvider>
  );
};

export default Storefront;
