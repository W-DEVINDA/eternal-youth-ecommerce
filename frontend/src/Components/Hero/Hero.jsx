import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";

import hero_image2 from "../Assets/hero_image2.png";
import hero_image3 from "../Assets/hero_image3.png";
import hero_image4 from "../Assets/hero_image4.png";
import hero_image5 from "../Assets/hero_image5.png";

import hand_icon from "../Assets/hand_icon.png";
import arrow_icon from "../Assets/arrow.png";

const heroImages = [ hero_image2, hero_image3, hero_image4, hero_image5, ];


const Hero = () => {
  const [imageIndex, setImageIndex] = useState(0);
  const [slideClass, setSlideClass] = useState("slide-in");
  const navigate = useNavigate();
useEffect(() => {
  const interval = setInterval(() => {
    setSlideClass("slide-out");
    setTimeout(() => {
      setImageIndex((prev) => (prev + 1) % heroImages.length);
      setSlideClass("slide-in");
    }, 45);
  }, 5500);
  return () => clearInterval(interval);
}, []);

  return (
    <div className="hero">
      <div className="hero-left">
    <h2 className="hero-title-animated">
  FIND YOUR DESIRED STYLE
</h2>
        <div>
          <div className="hero-hand-icon">
            <p>Favourite</p>
            <img src={hand_icon} alt="" />
          </div>
          <p>collections</p>
          <p>for every day</p>
        </div>
       <div className="hero-latest-btn" onClick={() => navigate("/womens")}>
          <div>Latest Collection</div>
          <img src={arrow_icon} alt="" />
        </div>
      </div>
      <div className="hero-right">
      <img 
  src={heroImages[imageIndex]} 
  alt="hero"
  className={slideClass}
/>
      </div>
    </div>
  );
};

export default Hero;
