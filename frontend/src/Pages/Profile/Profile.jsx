import React, { useEffect, useState } from "react";
import "./Profile.css";
import MyComplaints from "../MyComplaints/MyComplaints";
import { backend_url, currency } from "../../App";
import { useNavigate } from "react-router-dom";

const SRI_LANKA_DISTRICTS = [
  "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo",
  "Galle","Gampaha","Hambantota","Jaffna","Kalutara",
  "Kandy","Kegalle","Kilinochchi","Kurunegala","Mannar",
  "Matale","Matara","Monaragala","Mullaitivu","Nuwara Eliya",
  "Polonnaruwa","Puttalam","Ratnapura","Trincomalee","Vavuniya"
];

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reviewModal, setReviewModal] = useState(null); // { productId, productName }
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewMsg, setReviewMsg] = useState("");
  const [reviewedProducts, setReviewedProducts] = useState({});
const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "profile";
  });
const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ subject: "", description: "" });
  const [complaintMsg, setComplaintMsg] = useState("");
  const [freshComplaints, setFreshComplaints] = useState(null);
  const [openChatAfterSubmit, setOpenChatAfterSubmit] = useState(null);
  // Name edit
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameMsg, setNameMsg] = useState("");

  // Password edit
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passMsg, setPassMsg] = useState("");

  // Address
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "", phone: "", address: "", city: "", district: "Colombo", postalCode: ""
  });
  const [addressMsg, setAddressMsg] = useState("");

  const token = localStorage.getItem("auth-token");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchProfile();
    fetchOrders();
  }, []);
const submitReview = async () => {
    if (reviewForm.rating === 0) { setReviewMsg("Please select a star rating."); return; }
    if (!reviewForm.comment.trim()) { setReviewMsg("Please write a comment."); return; }
    const res = await fetch(`${backend_url}/addreview`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "auth-token": token },
      body: JSON.stringify({
        productId: reviewModal.productId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setReviewMsg("Review submitted successfully!");
      setReviewedProducts(prev => ({ ...prev, [reviewModal.productId]: true }));
      setTimeout(() => {
        setReviewModal(null);
        setReviewForm({ rating: 0, comment: "" });
        setReviewMsg("");
      }, 1500);
    } else {
      setReviewMsg(data.errors || "Failed to submit review.");
    }
  };
 const fetchProfile = async () => {
    try {
      const res = await fetch(`${backend_url}/getuserprofile`, {
        headers: { "auth-token": token }
      });
      const data = await res.json();
      if (data && data.name) {
        setUser(data);
        setNewName(data.name);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${backend_url}/getorders`, {
        headers: { "auth-token": token }
      });
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (error) {
      console.error("Orders fetch error:", error);
    }
  };

  const saveName = async () => {
    if (!newName.trim()) { setNameMsg("Name cannot be empty."); return; }
    const res = await fetch(`${backend_url}/updatename`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "auth-token": token },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    if (data.success) {
      setNameMsg("Name updated!");
      setEditingName(false);
      fetchProfile();
    } else setNameMsg("Failed to update name.");
  };

  const savePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setPassMsg("Please fill in all fields."); return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPassMsg("New passwords do not match."); return;
    }
    if (passwords.newPassword.length < 6) {
      setPassMsg("Password must be at least 6 characters."); return;
    }
    const res = await fetch(`${backend_url}/updatepassword`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "auth-token": token },
      body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }),
    });
    const data = await res.json();
    if (data.success) {
      setPassMsg("Password updated!");
      setEditingPassword(false);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else setPassMsg(data.errors || "Failed to update password.");
  };

  const addAddress = async () => {
    const { fullName, phone, address, city, postalCode } = newAddress;
    if (!fullName || !phone || !address || !city || !postalCode) {
      setAddressMsg("Please fill in all fields."); return;
    }
    const res = await fetch(`${backend_url}/addaddress`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "auth-token": token },
      body: JSON.stringify(newAddress),
    });
    const data = await res.json();
    if (data.success) {
      setUser(prev => ({ ...prev, addresses: data.addresses }));
      setShowAddAddress(false);
      setNewAddress({ fullName: "", phone: "", address: "", city: "", district: "Colombo", postalCode: "" });
      setAddressMsg("");
    } else setAddressMsg(data.errors || "Failed to add address.");
  };

  const deleteAddress = async (addressId) => {
    const res = await fetch(`${backend_url}/deleteaddress`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "auth-token": token },
      body: JSON.stringify({ addressId }),
    });
    const data = await res.json();
    if (data.success) setUser(prev => ({ ...prev, addresses: data.addresses }));
  };

  const setDefaultAddress = async (addressId) => {
    const res = await fetch(`${backend_url}/setdefaultaddress`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "auth-token": token },
      body: JSON.stringify({ addressId }),
    });
    const data = await res.json();
    if (data.success) setUser(prev => ({ ...prev, addresses: data.addresses }));
  };

 if (!user) return (
    <div className="profile-loading">
      <p>Loading...</p>
      <p style={{ fontSize: "0.85rem", color: "#aaa", marginTop: "8px" }}>
        If this takes too long, please <a href="/login" style={{ color: "#ff4141" }}>log in again</a>.
      </p>
    </div>
  );

  const initial = user.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <div className="profile">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar">{initial}</div>
        <div>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
       {["profile", "addresses", "orders", "complaints"].map(tab => (
        <button
          key={tab}
          className={`profile-tab ${activeTab === tab ? "active" : ""}`}
          onClick={() => setActiveTab(tab)}
        >
          {tab === "profile" ? "Profile" : tab === "addresses" ? "Addresses" : tab === "orders" ? "Order History" : "My Complaints"}
        </button>
      ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="profile-section">
          {/* Name */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>Full Name</h2>
              {!editingName && <button className="profile-edit-btn" onClick={() => { setEditingName(true); setNameMsg(""); }}>Edit</button>}
            </div>
            {editingName ? (
              <>
                <input className="profile-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Enter new name" />
                {nameMsg && <p className={`profile-msg ${nameMsg.includes("!") ? "success" : "error"}`}>{nameMsg}</p>}
                <div className="profile-card-actions">
                  <button className="profile-save-btn" onClick={saveName}>Save</button>
                  <button className="profile-cancel-btn" onClick={() => { setEditingName(false); setNameMsg(""); }}>Cancel</button>
                </div>
              </>
            ) : (
              <p className="profile-value">{user.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="profile-card">
            <div className="profile-card-header"><h2>Email</h2></div>
            <p className="profile-value">{user.email}</p>
          </div>

          {/* Password */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>Password</h2>
              {!editingPassword && <button className="profile-edit-btn" onClick={() => { setEditingPassword(true); setPassMsg(""); }}>Change</button>}
            </div>
            {editingPassword ? (
              <>
                <input className="profile-input" type="password" placeholder="Current password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} />
                <input className="profile-input" type="password" placeholder="New password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} />
                <input className="profile-input" type="password" placeholder="Confirm new password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} />
                {passMsg && <p className={`profile-msg ${passMsg.includes("!") ? "success" : "error"}`}>{passMsg}</p>}
                <div className="profile-card-actions">
                  <button className="profile-save-btn" onClick={savePassword}>Save</button>
                  <button className="profile-cancel-btn" onClick={() => { setEditingPassword(false); setPassMsg(""); }}>Cancel</button>
                </div>
              </>
            ) : (
              <p className="profile-value">••••••••</p>
            )}
          </div>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === "addresses" && (
        <div className="profile-section">
          {user.addresses.map(addr => (
            <div key={addr.id} className={`profile-card ${addr.isDefault ? "profile-card-default" : ""}`}>
              <div className="profile-card-header">
                <h2>{addr.fullName} {addr.isDefault && <span className="profile-default-badge">Default</span>}</h2>
                <div className="profile-card-actions-row">
                  {!addr.isDefault && (
                    <button className="profile-edit-btn" onClick={() => setDefaultAddress(addr.id)}>Set Default</button>
                  )}
                  <button className="profile-delete-btn" onClick={() => deleteAddress(addr.id)}>Remove</button>
                </div>
              </div>
              <p className="profile-value">{addr.address}, {addr.city}</p>
              <p className="profile-value">{addr.district} — {addr.postalCode}</p>
              <p className="profile-value">📞 {addr.phone}</p>
            </div>
          ))}

          {user.addresses.length < 3 && (
            <>
              {!showAddAddress ? (
                <button className="profile-add-btn" onClick={() => setShowAddAddress(true)}>+ Add New Address</button>
              ) : (
                <div className="profile-card">
                  <h2>New Address</h2>
                  {["fullName", "phone", "address", "city", "postalCode"].map(field => (
                    <input
                      key={field}
                      className="profile-input"
                      placeholder={field === "fullName" ? "Full Name" : field === "postalCode" ? "Postal Code" : field.charAt(0).toUpperCase() + field.slice(1)}
                      value={newAddress[field]}
                      onChange={e => setNewAddress(p => ({ ...p, [field]: e.target.value }))}
                    />
                  ))}
                  <select className="profile-input" value={newAddress.district} onChange={e => setNewAddress(p => ({ ...p, district: e.target.value }))}>
                    {SRI_LANKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {addressMsg && <p className="profile-msg error">{addressMsg}</p>}
                  <div className="profile-card-actions">
                    <button className="profile-save-btn" onClick={addAddress}>Save Address</button>
                    <button className="profile-cancel-btn" onClick={() => { setShowAddAddress(false); setAddressMsg(""); }}>Cancel</button>
                  </div>
                </div>
              )}
            </>
          )}
          {user.addresses.length >= 3 && (
            <p className="profile-msg error">Maximum of 3 addresses reached.</p>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="profile-section">
          {orders.length === 0 ? (
            <p className="profile-no-orders">No orders yet.</p>
          ) : (
            orders.map((order, i) => (
              <div key={i} className="profile-card">
                <div className="profile-card-header">
                  <h2>Order — {new Date(order.date).toLocaleDateString()}</h2>
                  <span className="profile-order-status">{order.status}</span>
                </div>
               <div className="profile-order-items">
                  {order.items.map((item, j) => (
                    <div key={j} className="profile-order-item">
                      <p>{item.name}</p>
                      <p>Size: {item.size} | Qty: {item.quantity}</p>
                      <p>{currency}{(item.price * item.quantity).toLocaleString()}</p>
                      {order.status === "Delivered" && !reviewedProducts[item.productId] && (
                        <button
                          className="profile-review-btn"
                          onClick={() => {
                            setReviewModal({ productId: item.productId, productName: item.name });
                            setReviewForm({ rating: 0, comment: "" });
                            setReviewMsg("");
                          }}
                        >
                          ⭐ Write Review
                        </button>
                      )}
                      {(order.status === "Delivered" && reviewedProducts[item.productId]) && (
                        <span className="profile-reviewed-badge">✓ Reviewed</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="profile-order-footer">
                  <p>Delivering to: {order.shipping.address}, {order.shipping.city}, {order.shipping.district}</p>
                 <p className="profile-value">Delivery Fee: {currency}50</p>
                  <p className="profile-order-total">Total: {currency}{order.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* Complaints Tab */}
      {activeTab === "complaints" && (
        <div className="profile-section">
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>My Complaints</h2>
              {!showComplaintForm && (
                <button className="profile-edit-btn" onClick={() => setShowComplaintForm(true)}>+ New Complaint</button>
              )}
            </div>
            {showComplaintForm && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  className="profile-input"
                  placeholder="Subject"
                  value={complaintForm.subject}
                  onChange={e => setComplaintForm(p => ({ ...p, subject: e.target.value }))}
                />
                <textarea
                  className="profile-input"
                  placeholder="Describe your issue..."
                  rows={4}
                  value={complaintForm.description}
                  onChange={e => setComplaintForm(p => ({ ...p, description: e.target.value }))}
                  style={{ resize: "vertical", fontFamily: "inherit" }}
                />
                {complaintMsg && <p className={`profile-msg ${complaintMsg.includes("!") ? "success" : "error"}`}>{complaintMsg}</p>}
                <div className="profile-card-actions">
                  <button className="profile-save-btn" onClick={async () => {
                    if (!complaintForm.subject || !complaintForm.description) { setComplaintMsg("Please fill in all fields."); return; }
                   const res = await fetch(`${backend_url}/submitcomplaint`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "auth-token": token },
                      body: JSON.stringify(complaintForm),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setComplaintForm({ subject: "", description: "" });
                      setShowComplaintForm(false);
                      // Refresh complaints and open chat
                      const res2 = await fetch(`${backend_url}/mycomplaints`, {
                        headers: { "auth-token": token }
                      });
                      const complaints = await res2.json();
                      setFreshComplaints(complaints);
                      setOpenChatAfterSubmit(complaints[0]);
                    } else setComplaintMsg("Failed to submit.");
                  }}>Submit</button>
                  <button className="profile-cancel-btn" onClick={() => { setShowComplaintForm(false); setComplaintMsg(""); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
         <MyComplaints
            freshComplaints={freshComplaints}
            openChatAfterSubmit={openChatAfterSubmit}
            onChatOpened={() => setOpenChatAfterSubmit(null)}
          />
        </div>
      )}
      {/* Review Modal */}
      {reviewModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <button className="profile-modal-close" onClick={() => setReviewModal(null)}>✕</button>
            <h2>Review: {reviewModal.productName}</h2>
            <p className="profile-modal-sub">Share your experience with this product</p>

            {/* Star Rating */}
            <div className="profile-star-selector">
              {[1,2,3,4,5].map(s => (
                <span
                  key={s}
                  className={(reviewHover || reviewForm.rating) >= s ? "profile-star filled" : "profile-star"}
                  onClick={() => setReviewForm(p => ({ ...p, rating: s }))}
                  onMouseEnter={() => setReviewHover(s)}
                  onMouseLeave={() => setReviewHover(0)}
                >★</span>
              ))}
            </div>

            {/* Comment */}
            <textarea
              className="profile-input"
              rows={4}
              placeholder="Write your review here..."
              value={reviewForm.comment}
              onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />

            {reviewMsg && (
              <p className={`profile-msg ${reviewMsg.includes("!") ? "success" : "error"}`}>
                {reviewMsg}
              </p>
            )}

            <div className="profile-card-actions">
              <button className="profile-save-btn" onClick={submitReview}>Submit Review</button>
              <button className="profile-cancel-btn" onClick={() => setReviewModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;