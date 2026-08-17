import React, { useEffect, useState, useRef } from "react";
import "./MyComplaints.css";
import { backend_url } from "../../App";
import { useSocket } from "../../Context/SocketContext";

const MyComplaints = ({ freshComplaints, openChatAfterSubmit, onChatOpened }) => {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const socket = useSocket();
  const token = localStorage.getItem("auth-token");

  const STATUS_COLORS = {
    "open": "#f59e0b",
    "in-progress": "#3b82f6",
    "resolved": "#22c55e"
  };

useEffect(() => {
    fetchComplaints();
    fetchUserName();
  }, []);

  useEffect(() => {
    if (freshComplaints) setComplaints(freshComplaints);
  }, [freshComplaints]);

  useEffect(() => {
    if (openChatAfterSubmit) {
      setSelectedComplaint(openChatAfterSubmit);
      setChatOpen(true);
      if (onChatOpened) onChatOpened();
    }
  }, [openChatAfterSubmit]);

 const selectedComplaintRef = useRef(null);

  useEffect(() => {
    selectedComplaintRef.current = selectedComplaint;
  }, [selectedComplaint]);

  useEffect(() => {
    if (!socket || !selectedComplaint) return;
    socket.emit("join_complaint", selectedComplaint._id);

    const handleMessage = (msg) => {
      const current = selectedComplaintRef.current;
      if (!current) return;
      setSelectedComplaint(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
      setComplaints(prev => prev.map(c =>
        c._id === current._id ? { ...c, messages: [...c.messages, msg] } : c
      ));
    };

    socket.on("receive_message", handleMessage);
    fetch(`${backend_url}/complaint/markread`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "auth-token": token },
      body: JSON.stringify({ complaintId: selectedComplaint._id }),
    });
    return () => socket.off("receive_message", handleMessage);
  }, [socket, selectedComplaint?._id]);

const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [selectedComplaint?.messages]);

  const fetchComplaints = async () => {
    const res = await fetch(`${backend_url}/mycomplaints`, {
      headers: { "auth-token": token }
    });
    const data = await res.json();
    setComplaints(data);
  };

  const fetchUserName = async () => {
    const res = await fetch(`${backend_url}/getuserprofile`, {
      headers: { "auth-token": token }
    });
    const data = await res.json();
    setUserName(data.name);
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedComplaint || !socket) return;
    socket.emit("send_message", {
      complaintId: selectedComplaint._id,
      sender: "customer",
      senderName: userName,
      text: message.trim(),
    });
    setMessage("");
  };

  const deleteComplaint = async (complaintId) => {
    const res = await fetch(`${backend_url}/deletecomplaint`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "auth-token": token },
      body: JSON.stringify({ complaintId }),
    });
    const data = await res.json();
    if (data.success) {
      setComplaints(prev => prev.filter(c => c._id !== complaintId));
      if (selectedComplaint?._id === complaintId) {
        setSelectedComplaint(null);
        setChatOpen(false);
      }
      setConfirmDelete(null);
    }
  };

  const openChat = (complaint) => {
    setSelectedComplaint(complaint);
    setChatOpen(true);
  };

  return (
    <div className="myc-wrapper">
      {complaints.length === 0 ? (
        <p className="myc-empty">No complaints submitted yet.</p>
      ) : (
        <div className="myc-list">
          {complaints.map(c => (
            <div key={c._id} className="myc-item">
              <div className="myc-item-info">
                <div className="myc-item-top">
                  <span className="myc-subject">{c.subject}</span>
                  <span className="myc-status" style={{ color: STATUS_COLORS[c.status] }}>
                    {c.status}
                  </span>
                </div>
                <p className="myc-desc">{c.description.slice(0, 80)}...</p>
                <p className="myc-date">{new Date(c.date).toLocaleDateString()}</p>
                {c.hasNewMessageForCustomer && (
                  <span className="myc-new-badge">New reply!</span>
                )}
              </div>
              <div className="myc-item-actions">
                <button className="myc-chat-btn" onClick={() => openChat(c)}>
                  💬 Chat
                </button>
                <button className="myc-delete-btn" onClick={() => setConfirmDelete(c._id)}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Popup */}
      {chatOpen && selectedComplaint && (
        <div className="myc-chat-wrapper">
          <div className="myc-chat-window">
            {/* Header */}
            <div className="myc-chat-header">
              <div className="myc-chat-header-info">
                <div className="myc-chat-avatar">CS</div>
                <div>
                  <p className="myc-chat-title">{selectedComplaint.subject}</p>
                  <p className="myc-chat-status" style={{ color: STATUS_COLORS[selectedComplaint.status] }}>
                    {selectedComplaint.status}
                  </p>
                </div>
              </div>
              <button className="myc-chat-close" onClick={() => setChatOpen(false)}>✕</button>
            </div>

           {/* Messages */}
            <div className="myc-chat-messages" ref={messagesContainerRef}>
              <div className="myc-waiting-msg">
                <p>🕐 Your complaint has been submitted. Please wait for while an assistant will help you shortly.</p>
              </div>
              {selectedComplaint.messages.map((msg, i) => (
                <div key={i} className={`myc-msg ${msg.sender === "customer" ? "mine" : "theirs"}`}>
                  <div className="myc-msg-bubble">
                    <p className="myc-msg-sender">{msg.senderName}</p>
                    <p>{msg.text}</p>
                    <p className="myc-msg-time">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
             
            </div>

            {/* Input */}
            {selectedComplaint.status !== "resolved" ? (
              <div className="myc-chat-input-row">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type a message..."
                  rows={1}
                />
                <button className="myc-chat-send" onClick={sendMessage}>
                  <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            ) : (
              <p className="myc-chat-resolved">This complaint has been resolved.</p>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="myc-modal-overlay">
          <div className="myc-modal">
            <p>Are you sure you want to delete this complaint? This cannot be undone.</p>
            <div className="myc-modal-btns">
              <button className="myc-modal-confirm" onClick={() => deleteComplaint(confirmDelete)}>
                Yes, Delete
              </button>
              <button className="myc-modal-cancel" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyComplaints;