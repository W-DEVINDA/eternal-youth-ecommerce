import React from "react";
import { useNavigate } from "react-router-dom";
import "./Offers.css";
import exclusive_image from "../Assets/exclusive_image.png";

const Offers = () => {
  const navigate = useNavigate();
  return (
    <div className="offers">
      <div className="offers-left">
        <h1>Exclusive</h1>
        <h1>Offers For You</h1>
        <p>FOR OUR BEST SELLING PRODUCTS</p>
       <button onClick={() => navigate("/womens")}>Check now</button>
      </div>
      <div className="offers-right">
        <img src={exclusive_image} alt="" />
      </div>
    </div>
  );
};

export default Offers;
