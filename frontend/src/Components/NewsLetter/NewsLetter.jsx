import React, { useState } from 'react'
import './NewsLetter.css'
import { backend_url } from '../../App'

const NewsLetter = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // "success" | "error" | "invalid"
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes("@")) {
      setStatus("invalid");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${backend_url}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus(data.already ? "already" : "error");
      }
    } catch {
      setStatus("error");
    }
    setLoading(false);
  };

  return (
    <div className='newsletter'>
      <h1>Get Exclusive Offers On Your Email</h1>
      <p>Subscribe to our newsletter and stay updated.</p>
      <div>
        <input
          type="email"
          placeholder='Your email id'
          value={email}
          onChange={e => { setEmail(e.target.value); setStatus(null); }}
          onKeyDown={e => e.key === "Enter" && handleSubscribe()}
        />
        <button onClick={handleSubscribe} disabled={loading}>
          {loading ? "..." : "Subscribe"}
        </button>
      </div>
      {status === "success" && (
        <p className="newsletter-msg success">🎉 You're subscribed! Check your email for exclusive offers.</p>
      )}
      {status === "already" && (
        <p className="newsletter-msg info">You're already subscribed!</p>
      )}
      {status === "invalid" && (
        <p className="newsletter-msg error">Please enter a valid email address.</p>
      )}
      {status === "error" && (
        <p className="newsletter-msg error">Something went wrong. Please try again.</p>
      )}
    </div>
  )
}

export default NewsLetter