import React, { useEffect, useState } from "react";
import "./ListProduct.css";
import cross_icon from '../Assets/cross_icon.png';
import upload_area from '../Assets/upload_area.svg';
import { backend_url, currency } from "../../App";

const PREDEFINED_TYPES = ["T-Shirt", "Trousers", "Dress", "Jacket", "Shoes", "Shorts", "Skirt", "Hoodie"];
const PREDEFINED_TAGS = ["Modern", "Latest", "Trending", "Classic", "Sale", "Premium"];

const ListProduct = () => {
 const [allproducts, setAllProducts] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editImages, setEditImages] = useState([]);
  const [customType, setCustomType] = useState("");
  const [customTag, setCustomTag] = useState("");

  const fetchInfo = () => {
    fetch(`${backend_url}/allproducts`)
      .then(res => res.json())
      .then(data => setAllProducts(data));
  };

  useEffect(() => { fetchInfo(); }, []);

  const removeProduct = async (id) => {
    await fetch(`${backend_url}/removeproduct`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchInfo();
  };

  const openEdit = (product) => {
    setEditProduct({ ...product, tags: product.tags || [], type: product.type || "" });
    setEditImages([]);
    setCustomType("");
    setCustomTag("");
  };

  const closeEdit = () => { setEditProduct(null); setEditImages([]); };

  const handleEditChange = (e) => {
    setEditProduct(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleTag = (tag) => {
    setEditProduct(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  };

  const addCustomTag = () => {
    const t = customTag.trim();
    if (t && !editProduct.tags.includes(t)) {
      setEditProduct(prev => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setCustomTag("");
  };

  const handleEditImageAdd = (e) => {
    const selected = Array.from(e.target.files);
    setEditImages(prev => [...prev, ...selected].slice(0, 4));
  };

  const handleEditImageRemove = (index) => {
    setEditImages(prev => prev.filter((_, i) => i !== index));
  };

  const saveEdit = async () => {
    const finalType = editProduct.type === "custom" ? customType.trim() : editProduct.type;
    let imageUrls = editProduct.images && editProduct.images.length > 0 ? editProduct.images : [editProduct.image];

    if (editImages.length > 0) {
      let formData = new FormData();
      editImages.forEach(img => formData.append('product', img));
      const uploadResp = await fetch(`${backend_url}/upload`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      }).then(r => r.json());
      if (uploadResp.success) imageUrls = uploadResp.image_urls;
    }

    await fetch(`${backend_url}/editproduct`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editProduct, type: finalType, images: imageUrls }),
    }).then(r => r.json()).then(data => {
      if (data.success) { alert("Product updated!"); fetchInfo(); closeEdit(); }
      else alert("Update failed");
    });
  };

  return (
    <div className="listproduct">
      <h1>All Products List</h1>
      <div className="listproduct-format-main">
<p>Products</p><p>Title</p><p>Old Price</p><p>New Price</p><p>Category</p><p>Actions</p>
      </div>
      <div className="listproduct-allproducts">
        <hr />
        {allproducts.map((e, index) => (
          <div key={index}>
            <div className="listproduct-format-main listproduct-format">
              <img className="listproduct-product-icon" src={backend_url + (e.images && e.images.length > 0 ? e.images[0] : e.image)} alt="" />
              <p>{e.name}</p>
              <p>{currency}{e.old_price}</p>
              <p>{currency}{e.new_price}</p>
              <p>{e.category}</p>
<div className="listproduct-actions">
  <button className="listproduct-edit-btn" onClick={() => openEdit(e)}>✏️</button>
 <img className="listproduct-remove-icon" onClick={() => setConfirmDeleteId(e.id)} src={cross_icon} alt="" />
</div>
            </div>
            <hr />
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <div className="listproduct-modal-overlay">
          <div className="listproduct-modal">
            <h2>Edit Product</h2>

            <label>Name</label>
            <input name="name" value={editProduct.name} onChange={handleEditChange} />

            <label>Description</label>
            <input name="description" value={editProduct.description} onChange={handleEditChange} />

            <div className="listproduct-modal-row">
              <div>
                <label>Old Price</label>
                <input name="old_price" type="number" value={editProduct.old_price} onChange={handleEditChange} />
              </div>
              <div>
                <label>New Price</label>
                <input name="new_price" type="number" value={editProduct.new_price} onChange={handleEditChange} />
              </div>
            </div>

            <label>Category</label>
            <select name="category" value={editProduct.category} onChange={handleEditChange}>
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="kid">Kid</option>
            </select>

            <label>Product Type</label>
            <select name="type" value={editProduct.type} onChange={handleEditChange}>
              <option value="">Select a type</option>
              {PREDEFINED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="custom">+ Add custom type</option>
            </select>
            {editProduct.type === "custom" && (
              <input value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Enter custom type" style={{ marginTop: "8px" }} />
            )}

            <label>Tags</label>
            <div className="addproduct-tags">
              {PREDEFINED_TAGS.map(tag => (
                <span key={tag} className={`addproduct-tag ${editProduct.tags.includes(tag) ? "selected" : ""}`} onClick={() => toggleTag(tag)}>{tag}</span>
              ))}
            </div>
            <div className="addproduct-custom-tag">
              <input value={customTag} onChange={e => setCustomTag(e.target.value)} placeholder="Add custom tag" onKeyDown={e => e.key === "Enter" && addCustomTag()} />
              <button onClick={addCustomTag}>Add</button>
            </div>
            {editProduct.tags.length > 0 && (
              <div className="addproduct-tags" style={{ marginTop: "8px" }}>
                {editProduct.tags.map(tag => (
                  <span key={tag} className="addproduct-tag selected">
                    {tag} <span onClick={() => toggleTag(tag)} style={{ cursor: "pointer", marginLeft: "4px" }}>✕</span>
                  </span>
                ))}
              </div>
            )}

            <label>Images (up to 4) — upload to replace existing</label>
           <div className="addproduct-img-grid">
  {[0, 1, 2, 3].map((index) => {
    const existingImg = editProduct.images && editProduct.images[index];
    const newImg = editImages[index];
    return (
      <div className="addproduct-img-slot" key={index}>
        {newImg ? (
          <>
            <img className="addproduct-thumbnail-img" src={URL.createObjectURL(newImg)} alt={`new-${index}`} />
            <span className="addproduct-img-delete-btn" onClick={() => handleEditImageRemove(index)}>✕</span>
          </>
        ) : existingImg ? (
          <>
            <img className="addproduct-thumbnail-img" src={backend_url + existingImg} alt={`existing-${index}`} />
            <span className="addproduct-img-delete-btn" onClick={() => {
              setEditProduct(prev => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== index)
              }));
            }}>✕</span>
          </>
        ) : index === (editImages.length + (editProduct.images?.length || 0)) ? (
          <label htmlFor="edit-file-input" style={{ cursor: "pointer" }}>
            <img className="addproduct-thumbnail-img" src={upload_area} alt="upload" />
          </label>
        ) : null}
      </div>
    );
  })}
</div>
<input onChange={handleEditImageAdd} type="file" id="edit-file-input" accept="image/*" multiple hidden />

            <div className="listproduct-modal-actions">
              <button className="listproduct-save-btn" onClick={saveEdit}>Save Changes</button>
              <button className="listproduct-cancel-btn" onClick={closeEdit}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="listproduct-modal-overlay">
          <div className="listproduct-modal">
            <p>Are you sure you want to delete this product? This cannot be undone.</p>
            <div className="listproduct-modal-buttons">
              <button className="listproduct-modal-confirm" onClick={() => { removeProduct(confirmDeleteId); setConfirmDeleteId(null); }}>
                Yes, Delete
              </button>
              <button className="listproduct-modal-cancel" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListProduct;