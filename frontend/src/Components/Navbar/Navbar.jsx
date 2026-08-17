import React, { useContext, useEffect, useRef, useState } from 'react'
import './Navbar.css'
import { Link } from 'react-router-dom'
import logo from '../Assets/logo.png'
import cart_icon from '../Assets/cart_icon.png'
import { ShopContext } from '../../Context/ShopContext'
import { backend_url } from '../../App'
import { useSocket } from '../../Context/SocketContext'
import { useNavigate } from 'react-router-dom'
import nav_dropdown from '../Assets/nav_dropdown.png'

const Navbar = () => {
  let [menu, setMenu] = useState("shop");
  const [navVisible, setNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setNavVisible(true);
      } else {
        setNavVisible(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);
  const { getTotalCartItems } = useContext(ShopContext);
  const [notifications, setNotifications] = useState([]);
  const socket = useSocket();
  const navigate = useNavigate();
  const menuRef = useRef();
  const isLoggedIn = !!localStorage.getItem("auth-token");

  useEffect(() => {
    if (isLoggedIn) fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("receive_message", (msg) => {
      if (msg.sender === "officer") fetchNotifications();
    });
    return () => socket.off("receive_message");
  }, [socket]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;
    const res = await fetch(`${backend_url}/notifications`, {
      headers: { "auth-token": token }
    });
    const data = await res.json();
    if (Array.isArray(data)) setNotifications(data);
  };

  const markAllRead = async (e) => {
    e.stopPropagation();
    await fetch(`${backend_url}/notifications/markallread`, {
      method: "POST",
      headers: { "auth-token": localStorage.getItem("auth-token") }
    });
    setNotifications([]);
  };

  const dropdown_toggle = (e) => {
    menuRef.current.classList.toggle('nav-menu-visible');
    e.target.classList.toggle('open');
  };

  return (
    <div className={`nav ${navVisible ? "nav-visible" : "nav-hidden"}`}>
      <Link to='/' onClick={() => setMenu("shop")} style={{ textDecoration: 'none' }} className="nav-logo">
        <img src={logo} alt="logo" />
        <p>Eternal Youth</p>
      </Link>

      <img onClick={dropdown_toggle} className='nav-dropdown' src={nav_dropdown} alt="" />

      <ul ref={menuRef} className="nav-menu">
        <li onClick={() => setMenu("shop")}><Link to='/' style={{ textDecoration: 'none' }}>Shop</Link>{menu === "shop" ? <hr /> : <></>}</li>
        <li onClick={() => setMenu("mens")}><Link to='/mens' style={{ textDecoration: 'none' }}>Men</Link>{menu === "mens" ? <hr /> : <></>}</li>
        <li onClick={() => setMenu("womens")}><Link to='/womens' style={{ textDecoration: 'none' }}>Women</Link>{menu === "womens" ? <hr /> : <></>}</li>
        <li onClick={() => setMenu("kids")}><Link to='/kids' style={{ textDecoration: 'none' }}>Kids</Link>{menu === "kids" ? <hr /> : <></>}</li>
      </ul>

      <div className="nav-login-cart">
        {/* Cart — always visible */}
        <Link to="/cart"><img src={cart_icon} alt="cart" /></Link>
        <div className="nav-cart-count">{getTotalCartItems()}</div>

        {isLoggedIn ? (
          /* Profile circle with hover dropdown */
          <div className="nav-profile-wrapper">
            <div className="nav-profile-circle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="22px" height="22px">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
              {notifications.length > 0 && (
                <span className="nav-profile-badge">{notifications.length}</span>
              )}
            </div>

            {/* Hover Dropdown */}
            <div className="nav-profile-dropdown">
              {/* Notifications */}
              <div className="nav-dropdown-section">
                <div className="nav-dropdown-section-header">
                  <span>🔔 Notifications</span>
                  {notifications.length > 0 && (
                    <button onClick={markAllRead}>Mark all read</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="nav-dropdown-empty">No new notifications</p>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="nav-notification-item" onClick={() => {
                      markAllRead({ stopPropagation: () => {} });
                      navigate("/profile?tab=complaints");
                    }}>
                      <p className="nav-notification-subject">💬 {n.subject}</p>
                      <p className="nav-notification-msg">{n.lastMessage?.text?.slice(0, 50)}...</p>
                    </div>
                  ))
                )}
              </div>

              <hr className="nav-dropdown-divider" />

              {/* My Profile */}
              <Link to="/profile" className="nav-dropdown-item">
                <svg viewBox="0 0 24 24" fill="#555" width="16" height="16">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
                My Profile
              </Link>

              {/* Logout */}
              <div className="nav-dropdown-item nav-dropdown-logout"
                onClick={() => { localStorage.removeItem('auth-token'); window.location.replace("/"); }}>
                <svg viewBox="0 0 24 24" fill="#ff4141" width="16" height="16">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
                Logout
              </div>
            </div>
          </div>
        ) : (
          <Link to='/login' style={{ textDecoration: 'none' }}>
            <button>Login</button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;