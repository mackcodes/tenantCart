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
    <div className="minimal-landing">
      <header className="site-header">
        <nav className="site-nav">
          <Link to="/" className="site-logo">
            Tenant<span>Cart</span>
          </Link>
        </nav>
      </header>

      <section className="storefront-header">
        <p className="eyebrow">{store.category}</p>
        <h1>{store.storeName}</h1>
        <p>{store.description}</p>
      </section>

      <div className="storefront-layout">
        {products.length === 0 ? (
          <p className="storefront-empty">
            This store hasn't added any products yet.
          </p>
        ) : (
          <div className="storefront-grid">
            {products.map((product) => (
              <div key={product._id} className="storefront-card">
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
