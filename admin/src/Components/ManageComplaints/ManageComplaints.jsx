import React, { useEffect, useState, useRef } from "react";
import "./ManageComplaints.css";
import { backend_url } from "../../App";
import { useSocket } from "../../Context/SocketContext";

const STATUS_COLORS = {
  "open": "#f59e0b",
  "in-progress": "#3b82f6",
  "resolved": "#22c55e",
};

const ManageComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
const socket = useSocket();


useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (!socket || !selected) return;
    socket.emit("join_complaint", selected._id);
    socket.on("receive_message", (msg) => {
      setSelected(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
      setComplaints(prev => prev.map(c => c._id === selected._id
        ? { ...c, messages: [...c.messages, msg] } : c));
    });
    return () => socket.off("receive_message");
  }, [socket, selected?._id]);

const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [selected?.messages]);
  const fetchComplaints = async () => {
    const res = await fetch(`${backend_url}/admin/complaints`);
    const data = await res.json();
    setComplaints(data);
  };

  const sendMessage = async () => {
    if (!message.trim() || !selected || !socket) return;
    socket.emit("send_message", {
      complaintId: selected._id,
      sender: "officer",
      senderName: "Customer Officer",
      text: message.trim(),
    });
    setMessage("");

    // Update status to in-progress if still open
    if (selected.status === "open") {
      await fetch(`${backend_url}/admin/complaint/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId: selected._id, status: "in-progress" }),
      });
      setSelected(prev => ({ ...prev, status: "in-progress" }));
      setComplaints(prev => prev.map(c => c._id === selected._id ? { ...c, status: "in-progress" } : c));
    }
  };
const [confirmDelete, setConfirmDelete] = useState(null);

  const deleteComplaint = async (complaintId) => {
    const res = await fetch(`${backend_url}/admin/deletecomplaint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintId }),
    });
    const data = await res.json();
    if (data.success) {
      setComplaints(prev => prev.filter(c => c._id !== complaintId));
      if (selected?._id === complaintId) setSelected(null);
      setConfirmDelete(null);
    }
  };

 const updateStatus = async (status) => {
    await fetch(`${backend_url}/admin/complaint/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintId: selected._id, status }),
    });
    setSelected(prev => ({ ...prev, status }));
    setComplaints(prev => prev.map(c => c._id === selected._id ? { ...c, status } : c));
  };

  const unreadCount = complaints.filter(c => c.hasNewMessageForAdmin).length;

  return (
    <div className="mc-wrapper">
      {/* Left panel - complaint list */}
      <div className="mc-list">
        <div className="mc-list-header">
          <h2>Complaints</h2>
          {unreadCount > 0 && <span className="mc-badge">{unreadCount}</span>}
        </div>
        {complaints.length === 0 && <p className="mc-empty">No complaints yet.</p>}
        {complaints.map(c => (
          <div
            key={c._id}
            className={`mc-list-item ${selected?._id === c._id ? "active" : ""} ${c.hasNewMessageForAdmin ? "unread" : ""}`}
            onClick={() => setSelected(c)}
          >
            <div className="mc-list-item-top">
              <span className="mc-list-name">{c.userName}</span>
              <span className="mc-status-dot" style={{ background: STATUS_COLORS[c.status] || "#888" }}></span>
            </div>
            <p className="mc-list-subject">{c.subject}</p>
            <p className="mc-list-date">{new Date(c.date).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      {/* Right panel - chat */}
      <div className="mc-chat">
        {!selected ? (
          <div className="mc-chat-empty">
            <p>Select a complaint to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="mc-chat-header">
              <div>
                <h3>{selected.subject}</h3>
                <p>{selected.userName} — {selected.userEmail}</p>
              </div>
             <div className="mc-status-controls">
                {["open", "in-progress", "resolved"].map(s => (
                  <button
                    key={s}
                    className={`mc-status-btn ${selected.status === s ? "active" : ""}`}
                    style={{ borderColor: STATUS_COLORS[s], color: selected.status === s ? "white" : STATUS_COLORS[s], background: selected.status === s ? STATUS_COLORS[s] : "white" }}
                    onClick={() => updateStatus(s)}
                  >
                    {s}
                  </button>
                ))}
                {selected.status === "resolved" && (
                  <button className="mc-delete-btn" onClick={() => setConfirmDelete(selected._id)}>
                    🗑 Delete
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="mc-messages" ref={messagesContainerRef}>
              {selected.messages.map((msg, i) => (
                <div key={i} className={`mc-message ${msg.sender === "officer" ? "officer" : "customer"}`}>
                  <div className="mc-message-bubble">
                    <p className="mc-message-sender">{msg.senderName}</p>
                    <p>{msg.text}</p>
                    <p className="mc-message-time">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              
            </div>

            {/* Input */}
            {selected.status !== "resolved" ? (
              <div className="mc-input-row">
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Type a reply..."
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            ) : (
              <p className="mc-resolved-msg">This complaint is resolved.</p>
            )}
          </>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="mc-modal-overlay">
          <div className="mc-modal">
            <p>Are you sure you want to permanently delete this complaint? This cannot be undone.</p>
            <div className="mc-modal-buttons">
              <button className="mc-modal-confirm" onClick={() => deleteComplaint(confirmDelete)}>
                Yes, Delete
              </button>
              <button className="mc-modal-cancel" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageComplaints;