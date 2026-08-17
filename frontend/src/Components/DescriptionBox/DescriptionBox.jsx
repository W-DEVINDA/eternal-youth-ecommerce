import React, { useEffect, useState } from "react";
import "./DescriptionBox.css";
import { backend_url } from "../../App";

const DescriptionBox = ({ description, productId }) => {
  const [activeTab, setActiveTab] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const isLoggedIn = !!localStorage.getItem("auth-token");

  const fetchReviews = async () => {
    const res = await fetch(`${backend_url}/reviews/${productId}`);
    const data = await res.json();
    setReviews(data);
  };

  useEffect(() => {
    if (activeTab === "reviews") fetchReviews();
  }, [activeTab, productId]);

  const submitReview = async () => {
    if (rating === 0) { setMessage("Please select a star rating."); return; }
    if (!comment.trim()) { setMessage("Please write a comment."); return; }

    const res = await fetch(`${backend_url}/addreview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-token": localStorage.getItem("auth-token"),
      },
      body: JSON.stringify({ productId, rating, comment }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage("Review submitted!");
      setRating(0);
      setComment("");
      fetchReviews();
    } else {
      setMessage(data.errors || "Something went wrong.");
    }
  };

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="descriptionbox">
      <div className="descriptionbox-navigator">
        <div
          className={`descriptionbox-nav-box ${activeTab === "description" ? "" : "fade"}`}
          onClick={() => setActiveTab("description")}
        >
          Description
        </div>
        <div
          className={`descriptionbox-nav-box ${activeTab === "reviews" ? "" : "fade"}`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews {reviews.length > 0 && activeTab === "reviews" ? `(${reviews.length})` : ""}
        </div>
      </div>

      {activeTab === "description" ? (
        <div className="descriptionbox-description">
          <p>{description}</p>
        </div>
      ) : (
        <div className="descriptionbox-reviews">

          {/* Average Rating Summary */}
          {averageRating && (
            <div className="descriptionbox-avg-rating">
              <span className="descriptionbox-avg-number">{averageRating}</span>
              <div className="descriptionbox-avg-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={s <= Math.round(averageRating) ? "star filled" : "star"}>★</span>
                ))}
              </div>
              <span className="descriptionbox-avg-count">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
            </div>
          )}

          {/* Existing Reviews */}
          <div className="descriptionbox-review-list">
            {reviews.length === 0 ? (
              <p className="descriptionbox-no-reviews">No reviews yet. Be the first!</p>
            ) : (
              reviews.map((r, i) => (
                <div key={i} className="descriptionbox-review-card">
                  <div className="descriptionbox-review-header">
                    <span className="descriptionbox-review-username">{r.username}</span>
                    <span className="descriptionbox-review-date">
                      {new Date(r.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="descriptionbox-review-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={s <= r.rating ? "star filled" : "star"}>★</span>
                    ))}
                  </div>
                  <p className="descriptionbox-review-comment">{r.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Add Review Form */}
          {isLoggedIn ? (
            <div className="descriptionbox-add-review">
              <h3>Write a Review</h3>
              <div className="descriptionbox-star-selector">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={(hoverRating || rating) >= s ? "star filled" : "star"}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                  >★</span>
                ))}
              </div>
              <textarea
                placeholder="Share your thoughts about this product..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
              {message && <p className="descriptionbox-review-message">{message}</p>}
              <button onClick={submitReview}>Submit Review</button>
            </div>
          ) : (
            <p className="descriptionbox-login-prompt">
              Please <a href="/login">log in</a> to leave a review.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DescriptionBox;