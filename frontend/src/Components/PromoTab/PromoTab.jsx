import React, { useState } from "react";
import "./PromoTab.css";
import { backend_url } from "../../App";

const PromoTab = () => {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`promo-tab-wrapper ${expanded ? "expanded" : ""}`}>
      {/* Side Label */}
      <div className="promo-tab-label" onClick={() => setExpanded(p => !p)}>
        <span>LKR 200 OFF!</span>
      </div>

      {/* Expandable Panel */}
      <div className="promo-tab-panel">
        <button className="promo-tab-close" onClick={() => setExpanded(false)}>✕</button>

        {!submitted ? (
          <>
            <div className="promo-tab-header">
              <p className="promo-tab-amount">LKR 200</p>
              <p className="promo-tab-off">OFF</p>
              <p className="promo-tab-desc">on your first order</p>
            </div>
            <p className="promo-tab-sub">Enter your email to claim your discount code</p>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleRegister()}
            />
            <button className="promo-tab-btn" onClick={handleRegister}>
              GET MY CODE
            </button>
            <p className="promo-tab-terms">Valid on first order only. One use per customer.</p>
          </>
        ) : (
          <div className="promo-tab-success">
            <div className="promo-tab-success-icon">✓</div>
            <p className="promo-tab-success-title">Your code is ready!</p>
            <div className="promo-tab-code-box">
              <span>{promoCode}</span>
              <button onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</button>
            </div>
            <p className="promo-tab-success-msg">Use this at checkout for LKR 200 off your first order.</p>
            <button className="promo-tab-btn" onClick={() => setExpanded(false)}>
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoTab;