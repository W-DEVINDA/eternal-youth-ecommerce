import React, { useState } from "react";
import "./CSS/LoginSignup.css";
import { GoogleLogin } from "@react-oauth/google";
import { backend_url } from "../App";

const LoginSignup = () => {
  const [state, setState] = useState("Login");
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [modal, setModal] = useState({ show: false, message: "", success: false });

  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showModal = (message, success = false) => {
    setModal({ show: true, message, success });
  };

 const login = async () => {
  if (!formData.email || !formData.password) { showModal("Please fill in all fields."); return; }
  const response = await fetch(`${backend_url}/login`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  const text = await response.text();
  if (!text) { showModal("No response from server. Please try again."); return; }
  const res = JSON.parse(text);

    if (res.success) {
      localStorage.setItem('auth-token', res.token);
      window.location.replace("/");
    } else {
      showModal(res.errors || "Login failed.");
    }
  };

 const signup = async () => {
  if (!formData.username || !formData.email || !formData.password) { showModal("Please fill in all fields."); return; }
  if (formData.password.length < 6) { showModal("Password must be at least 6 characters."); return; }
  const response = await fetch(`${backend_url}/signup`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  const text = await response.text();
  if (!text) { showModal("No response from server. Please try again."); return; }
  const res = JSON.parse(text);

    if (res.success) {
      localStorage.setItem('auth-token', res.token);
      window.location.replace("/");
    } else {
      showModal(res.errors || "Signup failed.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const res = await fetch(`${backend_url}/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: credentialResponse.credential }),
    }).then(r => r.json());

    if (res.success) {
      localStorage.setItem('auth-token', res.token);
      window.location.replace("/");
    } else {
      showModal(res.errors || "Google login failed.");
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>{state}</h1>

        <div className="loginsignup-fields">
          {state === "Sign Up" && (
            <input type="text" placeholder="Your name" name="username" value={formData.username} onChange={changeHandler} />
          )}
          <input type="email" placeholder="Email address" name="email" value={formData.email} onChange={changeHandler} />
          <input type="password" placeholder="Password" name="password" value={formData.password} onChange={changeHandler} />
        </div>

        <button onClick={() => { state === "Login" ? login() : signup(); }}>Continue</button>

        <div className="loginsignup-google">
          <p>Or {state === "Login" ? "login" : "sign up"} with</p>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => showModal("Google login failed.")}
            useOneTap
          />
        </div>

        {state === "Login"
          ? <p className="loginsignup-login">Create an account? <span onClick={() => setState("Sign Up")}>Click here</span></p>
          : <p className="loginsignup-login">Already have an account? <span onClick={() => setState("Login")}>Login here</span></p>
        }

        <div className="loginsignup-agree">
          <input type="checkbox" />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>
      </div>

      {/* Error/Success Modal */}
      {modal.show && (
        <div className="loginsignup-modal-overlay">
          <div className="loginsignup-modal">
            <div className={`loginsignup-modal-icon ${modal.success ? "success" : "error"}`}>
              {modal.success ? "✓" : "!"}
            </div>
            <p>{modal.message}</p>
            <button onClick={() => setModal({ show: false, message: "", success: false })}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginSignup;