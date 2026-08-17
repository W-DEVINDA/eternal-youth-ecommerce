import React, { useEffect, useState } from "react";
import "./PromoPopup.css";
import { backend_url } from "../../App";

const PromoPopup = () => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
const [submitted, setSubmitted] = useState(false);
  const [promoCode, setPromoCode] = useState("");

useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

const handleClose = () => {
    setShow(false);
  };

const handleRegister = async () => {
    if (!email.trim() || !email.includes("@")) return;
    try {
      const res = await fetch(`${backend_url}/promo/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) setPromoCode(data.code);
    } catch (e) {}
    setSubmitted(true);
  };
  if (!show) return null;

  return (
    <div className="promo-overlay">
      <div className="promo-popup">
        <button className="promo-close" onClick={handleClose}>✕</button>

        {!submitted ? (
          <>
            <p className="promo-top-text">Get exclusive offers and claim first dibs via email.</p>

            <div className="promo-offers">
              <div className="promo-offer-left">
                <p className="promo-get">GET</p>
                <p className="promo-amount">LKR 200 OFF</p>
                <p className="promo-condition">ON YOUR FIRST ORDER</p>
              </div>
              <div className="promo-divider"></div>
              <div className="promo-offer-right">
                <p className="promo-free">FREE STANDARD</p>
                <p className="promo-free">SHIPPING</p>
                <p className="promo-condition">ON YOUR FIRST ORDER</p>
              </div>
            </div>

            <div className="promo-input-row">
              <input
                type="email"
                placeholder="ENTER YOUR EMAIL ADDRESS"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button onClick={handleRegister}>REGISTER</button>
            </div>

            <p className="promo-terms">
              By registering, you agree to our <span>Privacy & Cookie Policy</span> and <span>Terms & Conditions</span>.
            </p>

            <div className="promo-checkbox-row">
              <input type="checkbox" id="promo-check" />
              <label htmlFor="promo-check">
                I'd like to receive exclusive offers and Eternal Youth news by email.
                I understand I can unsubscribe at anytime.
              </label>
            </div>
          </>
        ) : (
         <div className="promo-success">
          <div className="promo-success-icon">✓</div>
          <h2>You're in!</h2>
          <p>Use this code at checkout for <strong>LKR 200 off</strong> your first order:</p>
          {promoCode && (
            <div className="promo-code-box">
              <span>{promoCode}</span>
              <button onClick={() => navigator.clipboard.writeText(promoCode)}>Copy</button>
            </div>
          )}
          <button onClick={handleClose}>Start Shopping</button>
        </div>
        )}
      </div>
    </div>
  );
};

export default PromoPopup;