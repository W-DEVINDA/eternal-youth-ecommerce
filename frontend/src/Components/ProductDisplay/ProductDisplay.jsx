import React, { useContext, useState } from "react";
import "./ProductDisplay.css";
import star_icon from "../Assets/star_icon.png";
import star_dull_icon from "../Assets/star_dull_icon.png";
import { ShopContext } from "../../Context/ShopContext";
import { useEffect } from "react";
import { backend_url, currency } from "../../App";

const ProductDisplay = ({product}) => {

  const {addToCart} = useContext(ShopContext);
const [reviewStats, setReviewStats] = useState({ count: 0, avg: 0 });

useEffect(() => {
  fetch(`${backend_url}/reviews/${product.id}`)
    .then(r => r.json())
    .then(data => {
      if (data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setReviewStats({ count: data.length, avg });
      }
    });
}, [product.id]);
  const [selectedSize, setSelectedSize] = useState(null);

  // Support both old (single image) and new (images array) products
  const allImages = (product.images && product.images.length > 0)
    ? product.images
    : [product.image];

const [mainImage, setMainImage] = React.useState(allImages[0]);
  const [mainIndex, setMainIndex] = React.useState(0);
  const [zoomed, setZoomed] = React.useState(false);
  const [zoomPos, setZoomPos] = React.useState({ x: 50, y: 50 });

 const goNext = (e) => {
    e.stopPropagation();
    const next = (mainIndex + 1) % allImages.length;
    setMainIndex(next);
    setMainImage(allImages[next]);
    setZoomed(false);
  };

  const goPrev = (e) => {
    e.stopPropagation();
    const prev = (mainIndex - 1 + allImages.length) % allImages.length;
    setMainIndex(prev);
    setMainImage(allImages[prev]);
    setZoomed(false);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="productdisplay">
      <div className="productdisplay-left">
        <div className="productdisplay-img-list">
          {allImages.map((img, index) => (
            <img
              key={index}
              src={backend_url + img}
              alt={`thumb-${index}`}
             onClick={() => { setMainImage(img); setMainIndex(index); }}
              style={{ cursor: "pointer", border: mainImage === img ? "2px solid #ff4141" : "none", borderRadius: "4px" }}
            />
          ))}
        </div>
     <div
          className={`productdisplay-img ${zoomed ? "zoomed" : ""}`}
          onClick={() => setZoomed(p => !p)}
          onMouseMove={handleMouseMove}
        >
          <img
            className="productdisplay-main-img"
            src={backend_url + mainImage}
            alt="img"
           style={zoomed ? {
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
              transform: "scale(2)",
              cursor: "zoom-out",
            } : {
              transform: "scale(1)",
              cursor: "zoom-in",
            }}
          />

          {/* Arrows */}
          {allImages.length > 1 && (
            <>
              <button className="productdisplay-arrow productdisplay-arrow-left" onClick={goPrev}>
                &#8249;
              </button>
              <button className="productdisplay-arrow productdisplay-arrow-right" onClick={goNext}>
                &#8250;
              </button>
            </>
          )}
        </div>
      </div>
      <div className="productdisplay-right">
        <h1>{product.name}</h1>
        <div className="productdisplay-right-stars">
  {[1, 2, 3, 4, 5].map((s) => (
    <img
      key={s}
      src={s <= Math.round(reviewStats.avg) ? star_icon : star_dull_icon}
      alt=""
    />
  ))}
  <p>({reviewStats.count} {reviewStats.count === 1 ? "review" : "reviews"})</p>
</div>
        <div className="productdisplay-right-prices">
          <div className="productdisplay-right-price-old">{currency}{product.old_price}</div>
          <div className="productdisplay-right-price-new">{currency}{product.new_price}</div>
        </div>
        <div className="productdisplay-right-description">
        {product.description}
        </div>
        <div className="productdisplay-right-size">
          <h1>Select Size</h1>
       <div className="productdisplay-right-sizes">
            {["S", "M", "L", "XL", "XXL"].map((size) => (
              <div
                key={size}
                onClick={() => setSelectedSize(size)}
                style={{
                  backgroundColor: selectedSize === size ? "#ff4141" : "#fbfbfb",
                  color: selectedSize === size ? "#fff" : "#000",
                  border: selectedSize === size ? "1px solid #ff4141" : "1px solid #ebebeb",
                  cursor: "pointer"
                }}
              >
                {size}
              </div>
            ))}
          </div>
        </div>
       <button onClick={() => {
  if (!selectedSize) { alert("Please select a size!"); return; }
  addToCart(product.id, selectedSize);
}}>ADD TO CART</button>
        <p className="productdisplay-right-category"><span>Category :</span> {product.category}</p>
{product.type && <p className="productdisplay-right-category"><span>Type :</span> {product.type}</p>}

      </div>
    </div>
  );
};

export default ProductDisplay;
