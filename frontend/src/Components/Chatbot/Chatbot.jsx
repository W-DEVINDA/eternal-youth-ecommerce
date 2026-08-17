import React, { useState, useEffect, useRef } from "react";
import "./Chatbot.css";
import { backend_url } from "../../App";

const HF_API_KEY = process.env.REACT_APP_HF_API_KEY;
const HF_URL = "https://router.huggingface.co/nscale/v1/chat/completions";
const QUICK_ACTIONS = [
  "What products do you have?",
  "Help me find a product",
  "Track my order",
  "I have a complaint",
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! 👋 I'm the Eternal Youth assistant. I can help you with products, orders, and more. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
const [, setEscalated] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch(`${backend_url}/chatbot/products`)
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildSystemPrompt = () => {
   const productList = products
  .slice(0, 10)
  .map((p) => `- ${p.name} | ${p.category} | LKR ${p.new_price}`)
  .join("\n");

   return `You are a support assistant for "Eternal Youth", a Sri Lankan fashion boutique.
Sells: Men, Women, Kids fashion. Currency: LKR. Shipping: Sri Lanka only. Payment: Stripe.
For order tracking: tell users to check Profile > Order History.
For complaints you can't resolve, reply with "ESCALATE:" and a summary.
Be brief and friendly. Don't invent products.
Products: ${productList}`;
  };

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    console.log("API Key loaded:", HF_API_KEY ? "YES" : "NO - check .env file");

    const newMessages = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

   try {
      const chatMessages = [
        { role: "system", content: buildSystemPrompt() },
        ...newMessages.slice(-6).map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        })),
      ];

      const res = await fetch(HF_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${HF_API_KEY}`,
        },
    body: JSON.stringify({
  model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
          messages: chatMessages,
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      const data = await res.json();
      console.log("HF response:", JSON.stringify(data));

      let botReply = "Sorry, I couldn't process that. Please try again.";
      if (data?.choices?.[0]?.message?.content) {
        botReply = data.choices[0].message.content.trim();
      } else if (data?.error) {
        botReply = "Sorry, I couldn't process that. Please try again.";
      }
      // Check if escalation is needed
     if (botReply.startsWith("ESCALATE:")) {
        setEscalated(true);
        const isLoggedIn = !!localStorage.getItem("auth-token");
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: isLoggedIn
              ? "I'm sorry to hear that. Please go to your Profile → My Complaints tab to submit a complaint with full details. A customer officer will respond to you there directly."
              : "I'm sorry to hear that. Please log in first, then go to Profile → My Complaints to submit your complaint and chat with a customer officer.",
            escalated: true,
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "bot", text: botReply }]);
      }
} catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Sorry, something went wrong. Please try again later.",
        },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chatbot-wrapper">
      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                </svg>
              </div>
              <div>
                <p className="chatbot-header-name">Eternal Youth Assistant</p>
                <p className="chatbot-header-status">🟢 Online</p>
              </div>
            </div>
            <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-message ${msg.role === "user" ? "user" : "bot"}`}>
                {msg.role === "bot" && (
                  <div className="chatbot-bot-avatar">EY</div>
                )}
                <div className={`chatbot-bubble ${msg.role} ${msg.escalated ? "escalated" : ""}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chatbot-message bot">
                <div className="chatbot-bot-avatar">EY</div>
                <div className="chatbot-bubble bot chatbot-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="chatbot-quick-actions">
              {QUICK_ACTIONS.map((action, i) => (
                <button key={i} onClick={() => sendMessage(action)}>
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chatbot-input-row">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              disabled={loading}
            />
            <button
              className="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Bubble */}
      <button
        className={`chatbot-bubble-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="white" width="26" height="26">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        )}
        {!isOpen && <span className="chatbot-bubble-pulse"></span>}
      </button>
    </div>
  );
};

export default Chatbot;