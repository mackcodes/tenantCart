import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { checkout } from "../services/orderService.js";

import "./LandingPage.css";
import "./Storefront.css";

const getCartKey = (slug) => `tenantcart_cart_${slug}`;

const emptyForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const Checkout = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [cart, setCart] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(null);

  useEffect(() => {
    const storedCart = sessionStorage.getItem(getCartKey(slug));

    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (parseError) {
        setCart({});
      }
    }
  }, [slug]);

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (cartItems.length === 0) {
      setError("Your cart is empty");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const data = await checkout(slug, {
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        shippingAddress: {
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
        },
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      setOrderPlaced(data.order);
      sessionStorage.removeItem(getCartKey(slug));
      setCart({});
    } catch (requestError) {
      setError(requestError.message || "Unable to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="minimal-landing">
        <div className="checkout-wrapper">
          <p className="eyebrow">Order confirmed</p>
          <h1>Thank you, {orderPlaced.customerName}!</h1>
          <p>
            Your order total was {formatCurrency(orderPlaced.totalAmount)}.
            A confirmation was sent to {orderPlaced.customerEmail}.
          </p>

          <Link to={`/store/${slug}`} className="dark-button">
            Continue shopping
          </Link>
        </div>
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

      <div className="checkout-wrapper">
        <p className="eyebrow">Checkout</p>
        <h1>Complete your order</h1>

        {error && (
          <p className="form-message form-message--error" role="alert">
            {error}
          </p>
        )}

        <div className="checkout-summary">
          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cartItems.map((item) => (
                <div key={item.productId} className="storefront-cart-item">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}

              <div className="storefront-cart-total">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
            </>
          )}
        </div>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="customerEmail"
              value={form.customerEmail}
              onChange={handleChange}
              required
            />
          </label>

          <label className="wide">
            Phone
            <input
              name="customerPhone"
              value={form.customerPhone}
              onChange={handleChange}
            />
          </label>

          <label className="wide">
            Address line 1
            <input
              name="line1"
              value={form.line1}
              onChange={handleChange}
              required
            />
          </label>

          <label className="wide">
            Address line 2
            <input
              name="line2"
              value={form.line2}
              onChange={handleChange}
            />
          </label>

          <label>
            City
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            State
            <input
              name="state"
              value={form.state}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Postal code
            <input
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Country
            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              required
            />
          </label>

          <label className="wide">
            <button
              type="submit"
              className="dark-button large-button"
              disabled={submitting || cartItems.length === 0}
            >
              {submitting ? "Placing order..." : "Place order"}
            </button>
          </label>
        </form>

        <button
          type="button"
          className="text-button"
          onClick={() => navigate(`/store/${slug}`)}
        >
          ← Back to store
        </button>
      </div>
    </div>
  );
};

export default Checkout;
