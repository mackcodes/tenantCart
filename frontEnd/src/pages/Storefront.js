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

const Storefront = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState({});
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

        <aside className="storefront-cart">
          <h2>Your cart</h2>

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
    </div>
  );
};

export default Storefront;
