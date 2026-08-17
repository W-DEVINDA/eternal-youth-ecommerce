import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CartItems.css";
import cross_icon from "../Assets/cart_cross_icon.png";
import { ShopContext } from "../../Context/ShopContext";
import { backend_url, currency } from "../../App";

const CartItems = () => {
  const {products} = useContext(ShopContext);
 const {cartItems, addToCart, removeFromCart, deleteFromCart, getTotalCartAmount} = useContext(ShopContext);
const navigate = useNavigate();
  const [confirmKey, setConfirmKey] = useState(null);
  return (
    <div className="cartitems">
      <div className="cartitems-format-main">
        <p>Products</p>
        <p>Title</p>
        <p>Price</p>
        <p>Quantity</p>
        <p>Total</p>
        <p>Remove</p>
      </div>
      <hr />
{Object.entries(cartItems).map(([key, item]) => {
  console.log("Cart key:", key, "Cart item:", item);
  if (!item || typeof item !== "object" || !item.productId) return null;
  const product = products.find((e) => e.id === item.productId);
  if (!product || item.quantity <= 0) return null;
  return (
    <div key={key}>
      <div className="cartitems-format-main cartitems-format">
        <img className="cartitems-product-icon" src={backend_url + product.image} alt="" />
        <div>
          <p>{product.name}</p>
          <p className="cartitems-size">Size: <span>{item.size}</span></p>
        </div>
        <p>{currency}{product.new_price}</p>
        <div className="cartitems-quantity-control">
  <button onClick={() => removeFromCart(key)}>−</button>
  <span>{item.quantity}</span>
  <button onClick={() => addToCart(item.productId, item.size)}>+</button>
</div>
        <p>{currency}{(product.new_price * item.quantity).toFixed(2)}</p>
       <img onClick={() => setConfirmKey(key)} className="cartitems-remove-icon" src={cross_icon} alt="" />
      </div>
      <hr />
    </div>
  );
})}
      {confirmKey && (
        <div className="cartitems-modal-overlay">
          <div className="cartitems-modal">
            <p>Are you sure you want to remove this item from your cart?</p>
            <div className="cartitems-modal-buttons">
             <button className="cartitems-modal-confirm" onClick={() => { deleteFromCart(confirmKey); setConfirmKey(null); }}>Remove</button>
              <button className="cartitems-modal-cancel" onClick={() => setConfirmKey(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="cartitems-down">
        <div className="cartitems-total">
          <h1>Cart Totals</h1>
          <div>
            <div className="cartitems-total-item">
              <p>Subtotal</p>
              <p>{currency}{getTotalCartAmount()}</p>
            </div>
            <hr />
           <div className="cartitems-total-item">
              <p>Shipping Fee</p>
              <p>{currency}50</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <h3>Total</h3>
              <h3>{currency}{getTotalCartAmount() + 50}</h3>
            </div>
          </div>
          <button onClick={() => navigate("/checkout")}>PROCEED TO CHECKOUT</button>
        </div>
        <div className="cartitems-promocode">
          <p>If you have a promo code, Enter it here</p>
          <div className="cartitems-promobox">
            <input type="text" placeholder="promo code" />
            <button>Submit</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItems;
