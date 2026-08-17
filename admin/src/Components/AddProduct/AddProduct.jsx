import React, { useState } from "react";
import "./AddProduct.css";
import upload_area from "../Assets/upload_area.svg";
import { backend_url } from "../../App";

const PREDEFINED_TYPES = ["T-Shirt","Shirt", "Trousers", "Dress", "Jacket", "Shoes", "Shorts", "Skirt", "Hoodie"];
const PREDEFINED_TAGS = ["Modern", "Latest", "Trending", "Classic", "Sale", "Premium"];

const AddProduct = () => {
  const [images, setImages] = useState([]);
  const [productDetails, setProductDetails] = useState({
    name: "", description: "", category: "women",
    type: "", tags: [], new_price: "", old_price: ""
  });
  const [customType, setCustomType] = useState("");
const [customTag, setCustomTag] = useState("");
const [confirmRemoveIndex, setConfirmRemoveIndex] = useState(null);
const [successMsg, setSuccessMsg] = useState(false);

  const handleImageAdd = (e) => {
    const selected = Array.from(e.target.files);
    setImages(prev => [...prev, ...selected].slice(0, 4));
  };

  const handleImageRemove = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tag) => {
    setProductDetails(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  };

  const addCustomTag = () => {
    const t = customTag.trim();
    if (t && !productDetails.tags.includes(t)) {
      setProductDetails(prev => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setCustomTag("");
  };

  const changeHandler = (e) => {
    setProductDetails({ ...productDetails, [e.target.name]: e.target.value });
  };

 const AddProduct = async () => {
    if (images.length === 0) { alert("Please upload at least 1 image"); return; }
    if (!productDetails.description.trim()) { alert("Please enter a product description"); return; }
    if (!productDetails.name.trim()) { alert("Please enter a product name"); return; }
    if (!productDetails.type && !customType.trim()) { alert("Please select or enter a product type"); return; }

    const finalType = productDetails.type === "custom" ? customType.trim() : productDetails.type;

    let formData = new FormData();
    images.forEach(img => formData.append('product', img));
    const uploadResp = await fetch(`${backend_url}/upload`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    }).then(r => r.json());

    if (uploadResp.success) {
      const product = { ...productDetails, type: finalType, images: uploadResp.image_urls };
      await fetch(`${backend_url}/addproduct`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
        .then(r => r.json())
        .then(data => {
        if (data.success) {
          setSuccessMsg(true);
          // Reset all fields
          setProductDetails({
            name: "", description: "", category: "women",
            type: "", tags: [], new_price: "", old_price: ""
          });
          setImages([]);
          setCustomType("");
          setCustomTag("");
        } else {
          alert("Failed");
        }
      });
    }
  };

  return (
    <div className="addproduct">
      <div className="addproduct-itemfield">
        <p>Product title</p>
        <input type="text" name="name" value={productDetails.name} onChange={changeHandler} placeholder="Type here" />
      </div>
      <div className="addproduct-itemfield">
        <p>Product description</p>
        <input type="text" name="description" value={productDetails.description} onChange={changeHandler} placeholder="Type here" />
      </div>
      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <p>Price</p>
          <input type="number" name="old_price" value={productDetails.old_price} onChange={changeHandler} placeholder="Type here" />
        </div>
        <div className="addproduct-itemfield">
          <p>Offer Price</p>
          <input type="number" name="new_price" value={productDetails.new_price} onChange={changeHandler} placeholder="Type here" />
        </div>
      </div>
      <div className="addproduct-itemfield">
        <p>Product category</p>
        <select value={productDetails.category} name="category" className="add-product-selector" onChange={changeHandler}>
          <option value="women">Women</option>
          <option value="men">Men</option>
          <option value="kid">Kid</option>
        </select>
      </div>

      {/* Product Type */}
      <div className="addproduct-itemfield">
        <p>Product Type</p>
        <select value={productDetails.type} name="type" className="add-product-selector" onChange={changeHandler}>
          <option value="">Select a type</option>
          {PREDEFINED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          <option value="custom">+ Add custom type</option>
        </select>
     {productDetails.type && productDetails.type !== "custom" && !PREDEFINED_TYPES.includes(productDetails.type) && (
          <p style={{ marginTop: "6px", fontSize: "0.85rem", color: "#ff4141" }}>
            Custom type set: <strong>{productDetails.type}</strong>
          </p>
        )}
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <input
              type="text"
              value={customType}
              onChange={e => setCustomType(e.target.value)}
              placeholder="Enter custom type"
              style={{ flex: 1 }}
              onKeyDown={e => {
                if (e.key === "Enter" && customType.trim()) {
                  setProductDetails(prev => ({ ...prev, type: customType.trim() }));
                  setCustomType("");
                }
              }}
            />
            <button
              className="addproduct-custom-tag"
              style={{ padding: "8px 16px", background: "#ff4141", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
              onClick={() => {
                if (customType.trim()) {
                  setProductDetails(prev => ({ ...prev, type: customType.trim() }));
                  setCustomType("");
                }
              }}
            >
              Add
            </button>
          </div>
        
      </div>

      {/* Tags */}
      <div className="addproduct-itemfield">
        <p>Tags</p>
        <div className="addproduct-tags">
          {PREDEFINED_TAGS.map(tag => (
            <span
              key={tag}
              className={`addproduct-tag ${productDetails.tags.includes(tag) ? "selected" : ""}`}
              onClick={() => toggleTag(tag)}
            >{tag}</span>
          ))}
        </div>
        <div className="addproduct-custom-tag">
          <input
            type="text"
            value={customTag}
            onChange={e => setCustomTag(e.target.value)}
            placeholder="Add custom tag"
            onKeyDown={e => e.key === "Enter" && addCustomTag()}
          />
          <button onClick={addCustomTag}>Add</button>
        </div>
        {productDetails.tags.length > 0 && (
          <div className="addproduct-tags" style={{ marginTop: "8px" }}>
            {productDetails.tags.map(tag => (
              <span key={tag} className="addproduct-tag selected">
                {tag} <span onClick={() => toggleTag(tag)} style={{ cursor: "pointer", marginLeft: "4px" }}>✕</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div className="addproduct-itemfield">
        <p>Product Images (up to 4)</p>
        <div className="addproduct-img-grid">
          {[0, 1, 2, 3].map((index) => (
            <div className="addproduct-img-slot" key={index}>
              {images[index] ? (
                <>
                  <img className="addproduct-thumbnail-img" src={URL.createObjectURL(images[index])} alt={`product-${index}`} />
                 <span className="addproduct-img-delete-btn" onClick={() => setConfirmRemoveIndex(index)}>✕</span>
                </>
              ) : index === images.length ? (
                <label htmlFor="file-input" style={{ cursor: "pointer" }}>
                  <img className="addproduct-thumbnail-img" src={upload_area} alt="upload" />
                </label>
              ) : null}
            </div>
          ))}
        </div>
        <input onChange={handleImageAdd} type="file" id="file-input" accept="image/*" multiple hidden />
      </div>
      {/* Image delete confirmation modal */}
      {confirmRemoveIndex !== null && (
        <div className="addproduct-modal-overlay">
          <div className="addproduct-modal">
            <p>Are you sure you want to remove this image?</p>
            <div className="addproduct-modal-buttons">
              <button className="addproduct-modal-confirm" onClick={() => { handleImageRemove(confirmRemoveIndex); setConfirmRemoveIndex(null); }}>Yes, Remove</button>
              <button className="addproduct-modal-cancel" onClick={() => setConfirmRemoveIndex(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Product added success modal */}
      {successMsg && (
        <div className="addproduct-modal-overlay">
          <div className="addproduct-modal">
            <div className="addproduct-modal-success-icon">✓</div>
            <p>Product added successfully!</p>
            <div className="addproduct-modal-buttons">
              <button className="addproduct-modal-confirm" onClick={() => setSuccessMsg(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
      <button className="addproduct-btn" onClick={AddProduct}>ADD</button>
    </div>
  );
};

export default AddProduct;