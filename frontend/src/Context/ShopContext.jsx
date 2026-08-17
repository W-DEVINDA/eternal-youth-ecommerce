import React, { createContext, useEffect, useState } from "react";
import { backend_url } from "../App";

export const ShopContext = createContext(null);

const ShopContextProvider = (props) => {

  const [products, setProducts] = useState([]);

  const getDefaultCart = () => {
  return {};
};

  const [cartItems, setCartItems] = useState(getDefaultCart());

  useEffect(() => {
    fetch(`${backend_url}/allproducts`)
      .then((res) => res.json())
      .then((data) => setProducts(data))

    if (localStorage.getItem("auth-token")) {
      fetch(`${backend_url}/getcart`, {
        method: 'POST',
        headers: {
          Accept: 'application/form-data',
          'auth-token': `${localStorage.getItem("auth-token")}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(),
      })
        .then((resp) => resp.json())
        .then((data) => { setCartItems(data) });
    }
  }, [])

  const getTotalCartAmount = () => {
  let totalAmount = 0;
  for (const key in cartItems) {
    try {
      const { productId, quantity } = cartItems[key];
      const itemInfo = products.find((product) => product.id === productId);
      if (itemInfo) totalAmount += quantity * itemInfo.new_price;
    } catch (error) {}
  }
  return totalAmount;
};

  const getTotalCartItems = () => {
  let totalItem = 0;
  for (const key in cartItems) {
    try {
      totalItem += cartItems[key].quantity || 0;
    } catch (error) {}
  }
  return totalItem;
};

 const addToCart = (itemId, size) => {
  if (!localStorage.getItem("auth-token")) {
    alert("Please Login");
    return;
  }
  const key = `${itemId}_${size}`;
  setCartItems((prev) => ({
    ...prev,
    [key]: {
      quantity: (prev[key]?.quantity || 0) + 1,
      size,
      productId: itemId,
    }
  }));
  if (localStorage.getItem("auth-token")) {
    fetch(`${backend_url}/addtocart`, {
      method: 'POST',
      headers: {
        Accept: 'application/form-data',
        'auth-token': `${localStorage.getItem("auth-token")}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId: key }),
    })
  }
};
const deleteFromCart = (key) => {
  setCartItems((prev) => {
    const updated = { ...prev };
    delete updated[key];
    return updated;
  });
  if (localStorage.getItem("auth-token")) {
    fetch(`${backend_url}/removefromcart`, {
      method: 'POST',
      headers: {
        Accept: 'application/form-data',
        'auth-token': `${localStorage.getItem("auth-token")}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId: key }),
    })
  }
};
const removeFromCart = (key) => {
  setCartItems((prev) => {
    const updated = { ...prev };
    if (updated[key]?.quantity > 1) {
      updated[key] = { ...updated[key], quantity: updated[key].quantity - 1 };
    }
    return updated;
  });
  if (localStorage.getItem("auth-token")) {
    fetch(`${backend_url}/removefromcart`, {
      method: 'POST',
      headers: {
        Accept: 'application/form-data',
        'auth-token': `${localStorage.getItem("auth-token")}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId: key }),
    })
  }
};

const contextValue = { products, getTotalCartItems, cartItems, setCartItems, addToCart, removeFromCart, deleteFromCart, getTotalCartAmount };
  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
