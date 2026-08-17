import React, { useState, useEffect, useContext } from "react";
import "./Checkout.css";
import { ShopContext } from "../../Context/ShopContext";
import { backend_url, currency } from "../../App";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";

const stripePromise = loadStripe("pk_test_51TYFh449xdYxdXMcguNE1FezBOZNVdTWrHblzC7gt0h0499STAPFML0srn75q3HY5tWnkIfdB15ublsm12ifN2rB001ELBI1TV");

const SRI_LANKA_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

const CheckoutForm = ({ cartItems, products, totalAmount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
const [cardError, setCardError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [promoCode, setPromoCode] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [discount, setDiscount] = useState(0);
const [shipping, setShipping] = useState({
  fullName: "", phone: "", address: "",
  city: "", district: "Colombo", postalCode: ""
});

useEffect(() => {
  if (localStorage.getItem("auth-token")) {
    fetch(`${backend_url}/getuserprofile`, {
      headers: { "auth-token": localStorage.getItem("auth-token") }
    })
      .then(r => r.json())
      .then(data => {
        const def = data.addresses?.find(a => a.isDefault);
        if (def) setShipping({
          fullName: def.fullName,
          phone: def.phone,
          address: def.address,
          city: def.city,
          district: def.district,
          postalCode: def.postalCode,
        });
      });
  }
}, []);

  const handleShippingChange = (e) => {
    setShipping(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
const applyPromo = async () => {
    if (!promoInput.trim()) return;
    const res = await fetch(`${backend_url}/promo/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-token": localStorage.getItem("auth-token"),
      },
      body: JSON.stringify({ code: promoInput.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setPromoCode(data.code);
      setDiscount(data.discount);
      setPromoMsg(`✓ Code applied! LKR ${data.discount} off`);
    } else {
      setPromoMsg(data.errors || "Invalid code.");
      setDiscount(0);
      setPromoCode("");
    }
  };
  const handleSubmit = async () => {
    if (paymentMethod === "stripe" && (!stripe || !elements)) return;

    const { fullName, phone, address, city, district, postalCode } = shipping;
    if (!fullName || !phone || !address || !city || !postalCode) {
      setCardError("Please fill in all shipping fields."); return;
    }

    setLoading(true);
    setCardError("");

  try {
      // Cash on delivery
      if (paymentMethod === "cod") {
        const orderRes = await fetch(`${backend_url}/placeorder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("auth-token"),
          },
          body: JSON.stringify({
            items: Object.values(cartItems)
              .filter(item => item && typeof item === "object" && item.productId)
              .map(item => {
                const product = products.find(p => p.id === item.productId);
                return {
                  productId: item.productId,
                  name: product?.name || "",
                  size: item.size,
                  quantity: item.quantity,
                  price: product?.new_price || 0,
                };
              }),
            shipping,
            totalAmount: Math.max(totalAmount - discount, 0),
            paymentIntentId: "COD-" + Date.now(),
            promoCode: promoCode || null,
            paymentMethod: "cod",
          }),
        });
        const orderData = await orderRes.json();
        if (orderData.success) {
          onSuccess({
            items: Object.values(cartItems).filter(i => i && i.productId).map(item => {
              const product = products.find(p => p.id === item.productId);
              return { name: product?.name, size: item.size, quantity: item.quantity, price: product?.new_price };
            }),
            shipping,
            totalAmount: Math.max(totalAmount - discount, 0),
            paymentMethod: "cod",
          });
        }
        setLoading(false);
        return;
      }

      // Create payment intent
      const intentRes = await fetch(`${backend_url}/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("auth-token"),
        },
       body: JSON.stringify({
          amount: Math.max(totalAmount - discount, 0),
        }),
      });
      const { clientSecret, errors } = await intentRes.json();
      if (errors) { setCardError(errors); setLoading(false); return; }

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: fullName },
        },
      });

      if (result.error) {
        setCardError(result.error.message);
        setLoading(false);
        return;
      }

      if (result.paymentIntent.status === "succeeded") {
        // Build order items
        const items = Object.values(cartItems)
  .filter(item => item && typeof item === "object" && item.productId)
  .map(item => {
  const product = products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            name: product?.name || "",
            size: item.size,
            quantity: item.quantity,
            price: product?.new_price || 0,
          };
    });

        // Save order
        const orderRes = await fetch(`${backend_url}/placeorder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("auth-token"),
          },
         body: JSON.stringify({
            items,
            shipping,
            totalAmount: Math.max(totalAmount - discount, 0),
            paymentIntentId: result.paymentIntent.id,
            promoCode: promoCode || null,
          }),
        });
        const orderData = await orderRes.json();
        if (orderData.success) {
          onSuccess({ items, shipping, totalAmount });
        }
      }
    } catch (err) {
      setCardError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="checkout-form">
      {/* Shipping */}
      <div className="checkout-section">
        <h2>Shipping Details</h2>
        <div className="checkout-field">
          <label>Full Name</label>
          <input name="fullName" value={shipping.fullName} onChange={handleShippingChange} placeholder="Your Name" />
        </div>
        <div className="checkout-field">
          <label>Phone Number</label>
          <input name="phone" value={shipping.phone} onChange={handleShippingChange} placeholder="+94 XXX XXX XXXX" />
        </div>
        <div className="checkout-field">
          <label>Address</label>
          <input name="address" value={shipping.address} onChange={handleShippingChange} placeholder="123, Main Street" />
        </div>
        <div className="checkout-row">
          <div className="checkout-field">
            <label>City</label>
            <input name="city" value={shipping.city} onChange={handleShippingChange} placeholder="Colombo" />
          </div>
          <div className="checkout-field">
            <label>Postal Code</label>
            <input name="postalCode" value={shipping.postalCode} onChange={handleShippingChange} placeholder="00100" />
          </div>
        </div>
        <div className="checkout-field">
          <label>District</label>
          <select name="district" value={shipping.district} onChange={handleShippingChange}>
            {SRI_LANKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Order Summary */}
      <div className="checkout-section">
        <h2>Order Summary</h2>
        <div className="checkout-summary">
          {Object.values(cartItems).map((item, i) => {
  if (!item || typeof item !== "object" || !item.productId) return null;
  const product = products.find(p => p.id === item.productId);
  if (!product) return null;
            return (
              <div key={i} className="checkout-summary-item">
                <img src={backend_url + product.image} alt={product.name} />
                <div className="checkout-summary-info">
                  <p>{product.name}</p>
                  <p>Size: {item.size} | Qty: {item.quantity}</p>
                </div>
                <p>{currency}{(product.new_price * item.quantity).toLocaleString()}</p>
              </div>
            );
          })}
         <div className="checkout-summary-item" style={{ borderTop: "1px solid #ebebeb", paddingTop: "8px" }}>
            <div style={{ flex: 1 }}></div>
            <div className="checkout-summary-info">
              <p>Delivery Fee</p>
            </div>
            <p>{currency}50</p>
          </div>
          <div className="checkout-summary-total">
            <span>Total</span>
            <span>{currency}{totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>
{/* Promo Code */}
      <div className="checkout-section">
        <h2>Promo Code</h2>
        <div className="checkout-promo-row">
          <input
            placeholder="Enter promo code"
            value={promoInput}
            onChange={e => { setPromoInput(e.target.value); setPromoMsg(""); }}
          />
          <button onClick={applyPromo}>Apply</button>
        </div>
        {promoMsg && (
          <p className={`checkout-promo-msg ${discount > 0 ? "success" : "error"}`}>
            {promoMsg}
          </p>
        )}
        {discount > 0 && (
          <div className="checkout-discount-row">
            <span>Discount</span>
            <span>- LKR {discount.toLocaleString()}</span>
          </div>
        )}
      </div>
      {/* Payment */}
      <div className="checkout-section">
        <h2>Payment</h2>

        {/* Payment Method Selector */}
        <div className="checkout-payment-methods">
          <div
            className={`checkout-payment-option ${paymentMethod === "stripe" ? "active" : ""}`}
            onClick={() => setPaymentMethod("stripe")}
          >
            <div className="checkout-payment-radio">
              {paymentMethod === "stripe" && <div className="checkout-payment-radio-dot" />}
            </div>
            <div className="checkout-payment-info">
              <p className="checkout-payment-label">Credit / Debit Card</p>
              <p className="checkout-payment-sub">Secure payment via Stripe</p>
            </div>
            <svg viewBox="0 0 60 25" width="50" height="20">
              <text x="0" y="20" fontSize="22" fontWeight="bold" fill="#635bff">stripe</text>
            </svg>
          </div>

          <div
            className={`checkout-payment-option ${paymentMethod === "cod" ? "active" : ""}`}
            onClick={() => setPaymentMethod("cod")}
          >
            <div className="checkout-payment-radio">
              {paymentMethod === "cod" && <div className="checkout-payment-radio-dot" />}
            </div>
            <div className="checkout-payment-info">
              <p className="checkout-payment-label">Cash on Delivery</p>
              <p className="checkout-payment-sub">Pay when your order arrives</p>
            </div>
            <span style={{ fontSize: "1.4rem" }}>💵</span>
          </div>
        </div>

        {/* Stripe Card Element - only show when stripe selected */}
        {paymentMethod === "stripe" && (
        <div className="checkout-card-element">
          <CardElement options={{
            style: {
              base: { fontSize: "16px", color: "#333", "::placeholder": { color: "#aaa" } },
              invalid: { color: "#ff4141" },
            }
          }} />
        </div>
       )}
        {cardError && <p className="checkout-error">{cardError}</p>}
        <button className="checkout-pay-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Processing..." : paymentMethod === "cod"
            ? `Place Order (Cash on Delivery) — ${currency}${Math.max(totalAmount - discount, 0).toLocaleString()}`
            : `Pay ${currency}${Math.max(totalAmount - discount, 0).toLocaleString()}`}
        </button>
      </div>
    </div>
  );
};

const Checkout = () => {
  const { cartItems, products, getTotalCartAmount, setCartItems } = useContext(ShopContext);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const DELIVERY_FEE = 50;
  const totalAmount = getTotalCartAmount() + DELIVERY_FEE;

  const handleSuccess = (orderDetails) => {
    setCartItems({});
    setOrderSuccess(orderDetails);
  };

  if (!localStorage.getItem("auth-token")) {
    return (
      <div className="checkout-login-prompt">
        <p>Please <a href="/login">log in</a> to proceed to checkout.</p>
      </div>
    );
  }

  return (
    <div className="checkout">
      <h1>Checkout</h1>
      <Elements stripe={stripePromise}>
        <CheckoutForm
          cartItems={cartItems}
          products={products}
          totalAmount={totalAmount}
          onSuccess={handleSuccess}
        />
      </Elements>

      {/* Success Modal */}
      {orderSuccess && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal">
            <div className="checkout-modal-icon">✓</div>
            <h2>Order Placed!</h2>
            <p>Thank you, <strong>{orderSuccess.shipping.fullName}</strong>!</p>
            <p>
              {orderSuccess.paymentMethod === "cod"
                ? "Your order has been placed! Please have cash ready on delivery."
                : `Your payment of `}
              {orderSuccess.paymentMethod !== "cod" && <strong>{currency}{orderSuccess.totalAmount.toLocaleString()}</strong>}
              {orderSuccess.paymentMethod !== "cod" && " was successful."}
            </p>
            <p>Delivering to: <strong>{orderSuccess.shipping.address}, {orderSuccess.shipping.city}, {orderSuccess.shipping.district}</strong></p>
            <div className="checkout-modal-items">
              {orderSuccess.items.map((item, i) => (
                <p key={i}>{item.name} — Size: {item.size} × {item.quantity}</p>
              ))}
            </div>
            <button onClick={() => navigate("/")}>Continue Shopping</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;