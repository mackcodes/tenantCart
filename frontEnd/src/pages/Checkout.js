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
import { initiatePayment, verifyPayment } from "../services/paymentService.js";
import { getStorefront } from "../services/storefrontService.js";
import { validateDiscountCode } from "../services/discountService.js";

import "./LandingPage.css";
import "./Storefront.css";
import "../styles/checkout.css";

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

/**
 * Dynamically load the Razorpay checkout script once per page load.
 * Returns a promise that resolves when the script is ready.
 */
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Checkout = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [cart, setCart] = useState({});
  const [shipping, setShipping] = useState({
    flatRate: 0,
    freeShippingThreshold: 1000,
    localPickupEnabled: false,
    estimatedDelivery: "3-5 business days",
  });
  const [shippingMethod, setShippingMethod] = useState("delivery");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  useEffect(() => {
    const loadShipping = async () => {
      try {
        const data = await getStorefront(slug);
        setShipping((currentShipping) => ({
          ...currentShipping,
          ...(data.store?.shipping || {}),
        }));
      } catch (requestError) {
        // The order endpoint remains authoritative if shipping settings cannot load.
      }
    };

    loadShipping();

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
  const shippingAmount = shippingMethod === "pickup"
    ? 0
    : cartTotal >= Number(shipping.freeShippingThreshold || 0)
      ? 0
      : Number(shipping.flatRate || 0);
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const checkoutTotal = Math.max(0, cartTotal - discountAmount) + shippingAmount;

  const handleApplyDiscount = async () => {
    setError("");
    setApplyingDiscount(true);

    try {
      const result = await validateDiscountCode(slug, discountCodeInput, cartTotal);
      setAppliedDiscount(result);
    } catch (requestError) {
      setAppliedDiscount(null);
      setError(requestError.message || "Unable to apply discount code");
    } finally {
      setApplyingDiscount(false);
    }
  };

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

      // Step 1 — Create the order in our database (status: pending)
      const orderData = await checkout(slug, {
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
        shippingMethod,
        discountCode: appliedDiscount?.code || undefined,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      const order = orderData.order;
      const paymentToken = orderData.paymentToken;

      // Step 2 — Get a Razorpay order from the backend
      const paymentData = await initiatePayment(
        order._id,
        paymentToken
      );

      // Step 3 — Load Razorpay JS SDK and open the payment modal
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setError(
          "Unable to load the payment gateway. Please check your internet connection and try again."
        );
        setSubmitting(false);
        return;
      }

      const razorpayOptions = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: document.title || "TenantCart",
        description: `Order #${order._id}`,
        order_id: paymentData.razorpayOrderId,
        prefill: {
          name: form.customerName,
          email: form.customerEmail,
          contact: form.customerPhone,
        },
        theme: {
          color: "#26362e",
        },

        // Step 4 — Verify payment on our backend after success
        handler: async (response) => {
          try {
            await verifyPayment({
              orderId: order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentToken,
            });

            // Clear the cart and show the confirmation screen
            sessionStorage.removeItem(getCartKey(slug));
            setCart({});
            setOrderPlaced({ ...order, status: "paid" });
          } catch (verifyError) {
            setError(
              verifyError.message ||
                "Payment received but verification failed. Please contact support with your order ID: " +
                  order._id
            );
          } finally {
            setSubmitting(false);
          }
        },

        modal: {
          ondismiss: () => {
            // User closed the modal without paying — order stays pending
            setError(
              "Payment was not completed. Your order is saved — you can try again or contact the store."
            );
            setSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(razorpayOptions);
      rzp.open();

      // Note: setSubmitting(false) happens inside handler / ondismiss
    } catch (requestError) {
      setError(requestError.message || "Unable to place order");
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
            Your payment of {formatCurrency(orderPlaced.totalAmount)} was
            successful. A confirmation was sent to {orderPlaced.customerEmail}.
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
                <span>Items</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>

              <div className="storefront-cart-total">
                <span>{shippingMethod === "pickup" ? "Pickup" : "Shipping"}</span>
                <span>
                  {shippingAmount === 0 ? "Free" : formatCurrency(shippingAmount)}
                </span>
              </div>

              <div className="checkout-discount">
                <input
                  type="text"
                  placeholder="Discount code"
                  value={discountCodeInput}
                  onChange={(event) => setDiscountCodeInput(event.target.value)}
                  disabled={Boolean(appliedDiscount)}
                />
                {appliedDiscount ? (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setAppliedDiscount(null);
                      setDiscountCodeInput("");
                    }}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-button"
                    disabled={!discountCodeInput.trim() || applyingDiscount}
                    onClick={handleApplyDiscount}
                  >
                    {applyingDiscount ? "Applying..." : "Apply"}
                  </button>
                )}
              </div>

              {discountAmount > 0 && (
                <div className="storefront-cart-total">
                  <span>Discount ({appliedDiscount.code})</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="storefront-cart-total">
                <strong>Total</strong>
                <strong>{formatCurrency(checkoutTotal)}</strong>
              </div>
            </>
          )}
        </div>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <fieldset className="checkout-shipping-method wide">
            <legend>Delivery method</legend>
            <label>
              <input
                type="radio"
                name="shippingMethod"
                value="delivery"
                checked={shippingMethod === "delivery"}
                onChange={(event) => setShippingMethod(event.target.value)}
              />
              <span>
                <strong>Delivery</strong>
                <small>
                  {shippingAmount === 0
                    ? "Free delivery"
                    : `${formatCurrency(shippingAmount)} · ${shipping.estimatedDelivery}`}
                </small>
              </span>
            </label>
            {shipping.localPickupEnabled && (
              <label>
                <input
                  type="radio"
                  name="shippingMethod"
                  value="pickup"
                  checked={shippingMethod === "pickup"}
                  onChange={(event) => setShippingMethod(event.target.value)}
                />
                <span>
                  <strong>Local pickup</strong>
                  <small>Collect from the store for free</small>
                </span>
              </label>
            )}
          </fieldset>

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
              required={shippingMethod === "delivery"}
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
              required={shippingMethod === "delivery"}
            />
          </label>

          <label>
            State
            <input
              name="state"
              value={form.state}
              onChange={handleChange}
              required={shippingMethod === "delivery"}
            />
          </label>

          <label>
            Postal code
            <input
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
              required={shippingMethod === "delivery"}
            />
          </label>

          <label>
            Country
            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              required={shippingMethod === "delivery"}
            />
          </label>

          <label className="wide">
            <button
              type="submit"
              className="dark-button large-button"
              disabled={submitting || cartItems.length === 0}
            >
              {submitting ? "Opening payment…" : "Pay with Razorpay"}
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
