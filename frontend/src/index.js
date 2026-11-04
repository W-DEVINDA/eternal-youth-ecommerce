import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ShopContextProvider from './Context/ShopContext';

// Screens wider than the 1536px laptop design get the same layout, scaled up to fit
const DESIGN_WIDTH = 1536;
const fitToScreen = () => {
  const w = window.innerWidth;
  document.documentElement.style.zoom = w > DESIGN_WIDTH ? String(w / DESIGN_WIDTH) : '';
};
fitToScreen();
window.addEventListener('resize', fitToScreen);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ShopContextProvider>
      <App />
    </ShopContextProvider>
);
