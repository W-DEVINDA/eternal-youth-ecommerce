import React, { useEffect, useState } from "react";
import "./ManageOrders.css";
import { backend_url, currency } from "../../App";

const ORDER_STATUSES = [
  "Pending",
  "Order Confirmed",
  "Processing",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
];

const STATUS_COLORS = {
  "Pending": "#f59e0b",
  "Order Confirmed": "#3b82f6",
  "Processing": "#8b5cf6",
  "Dispatched": "#f97316",
  "Out for Delivery": "#06b6d4",
  "Delivered": "#22c55e",
};

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState("");

  const fetchOrders = async () => {
    const res = await fetch(`${backend_url}/admin/allorders`);
    const data = await res.json();
    setOrders(data);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    const res = await fetch(`${backend_url}/admin/updateorderstatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    const data = await res.json();
    if (data.success) {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      showToast("Order status updated!");
    }
    setUpdatingId(null);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const filtered = filter === "All" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="manageorders">
      <h1>Manage Orders</h1>

      {/* Filter Bar */}
      <div className="manageorders-filters">
        {["All", ...ORDER_STATUSES].map(s => (
          <button
            key={s}
            className={`manageorders-filter-btn ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Orders Count */}
      <p className="manageorders-count">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</p>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <p className="manageorders-empty">No orders found.</p>
      ) : (
        filtered.map((order) => (
          <div key={order._id} className="manageorders-card">
            {/* Card Header */}
            <div className="manageorders-card-header">
              <div>
                <p className="manageorders-order-id">Order #{order._id.slice(-8).toUpperCase()}</p>
                <p className="manageorders-date">{new Date(order.date).toLocaleString()}</p>
              </div>
              <span
                className="manageorders-status-badge"
                style={{ background: STATUS_COLORS[order.status] || "#888" }}
              >
                {order.status}
              </span>
            </div>

            {/* Customer Info */}
            <div className="manageorders-customer">
              <p><span>Customer:</span> {order.user?.name || "N/A"}</p>
              <p><span>Email:</span> {order.user?.email || "N/A"}</p>
              <p><span>Phone:</span> {order.shipping?.phone}</p>
              <p><span>Address:</span> {order.shipping?.address}, {order.shipping?.city}, {order.shipping?.district} — {order.shipping?.postalCode}</p>
            </div>

            {/* Order Items */}
            <div className="manageorders-items">
              {order.items.map((item, i) => (
                <div key={i} className="manageorders-item">
                  <p className="manageorders-item-name">{item.name}</p>
                  <p>Size: {item.size}</p>
                  <p>Qty: {item.quantity}</p>
                  <p>{currency}{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="manageorders-card-footer">
              <p className="manageorders-total">Total: <strong>{currency}{order.totalAmount?.toLocaleString()}</strong></p>
              <div className="manageorders-status-update">
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                  disabled={updatingId === order._id}
                  style={{ borderColor: STATUS_COLORS[order.status] || "#ddd" }}
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {updatingId === order._id && <span className="manageorders-updating">Updating...</span>}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Toast Notification */}
      {toast && <div className="manageorders-toast">{toast}</div>}
    </div>
  );
};

export default ManageOrders;