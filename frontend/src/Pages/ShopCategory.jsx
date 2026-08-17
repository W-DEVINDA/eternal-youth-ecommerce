import React, { useEffect, useState, useRef } from "react";
import "./CSS/ShopCategory.css";
import dropdown_icon from '../Components/Assets/dropdown_icon.png'
import Item from "../Components/Item/Item";
import { Link } from "react-router-dom";
import { backend_url } from "../App";

const ShopCategory = (props) => {
  const [allproducts, setAllProducts] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerFade, setBannerFade] = useState(true);
  const dropdownRef = useRef(null);

  const banners = props.banners || (props.banner ? [props.banner] : []);
useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setBannerFade("slide-out");
      setTimeout(() => {
        setBannerIndex(prev => (prev + 1) % banners.length);
        setBannerFade("slide-in");
      }, 1200);
    }, 7000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    fetch(`${backend_url}/allproducts`)
      .then(res => res.json())
      .then(data => setAllProducts(data));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get unique types for this category
  const categoryProducts = allproducts.filter(p => p.category === props.category);
  const types = ["All", ...new Set(
    categoryProducts
      .map(p => p.type)
      .filter(t => t && t.trim() !== "")
  )];

  // Filter products
  const filteredProducts = categoryProducts.filter(p =>
    selectedType === "All" || p.type === selectedType
  );

  return (
    <div className="shopcategory">
    <div className="shopcategory-banner-wrapper">
        <img
          src={banners[bannerIndex]}
          className={`shopcategory-banner ${bannerFade}`}
          alt=""
        />
      </div>
      <div className="shopcategory-indexSort">
        <p>
          <span>Showing {filteredProducts.length}</span> out of {categoryProducts.length} Products
        </p>

        {/* Sort Dropdown */}
        <div className="shopcategory-sort-wrapper" ref={dropdownRef}>
          <div
            className="shopcategory-sort"
            onClick={() => setDropdownOpen(p => !p)}
          >
            {selectedType === "All" ? "Sort by Type" : selectedType}
            <img
              src={dropdown_icon}
              alt=""
              style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.3s" }}
            />
          </div>
          {dropdownOpen && (
            <div className="shopcategory-dropdown">
              {types.map((type, i) => (
                <div
                  key={i}
                  className={`shopcategory-dropdown-item ${selectedType === type ? "active" : ""}`}
                  onClick={() => { setSelectedType(type); setDropdownOpen(false); }}
                >
                  {type}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="shopcategory-products">
        {filteredProducts.length === 0 ? (
          <p className="shopcategory-empty">No products found for this type.</p>
        ) : (
          filteredProducts.map((item, i) => (
            <Item
              key={i}
              id={item.id}
              name={item.name}
              image={item.image}
              new_price={item.new_price}
              old_price={item.old_price}
            />
          ))
        )}
      </div>

      <div className="shopcategory-loadmore">
        <Link to='/' style={{ textDecoration: 'none' }}>Explore More</Link>
      </div>
    </div>
  );
};

export default ShopCategory;