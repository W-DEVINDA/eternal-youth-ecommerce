import { GoogleOAuthProvider } from "@react-oauth/google";
import Chatbot from "./Components/Chatbot/Chatbot";
import { SocketProvider } from "./Context/SocketContext";
import PageTransition from "./Components/PageTransition/PageTransition";
import PromoPopup from "./Components/PromoPopup/PromoPopup";
import PromoTab from "./Components/PromoTab/PromoTab";
import Navbar from "./Components/Navbar/Navbar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Shop from "./Pages/Shop";
import Cart from "./Pages/Cart";
import Product from "./Pages/Product";
import Footer from "./Components/Footer/Footer";
import ShopCategory from "./Pages/ShopCategory";
import women_banner from "./Components/Assets/banner_women.png";
import women_banner1 from "./Components/Assets/banner_women1.png";
import women_banner2 from "./Components/Assets/banner_women2.png";
import men_banner from "./Components/Assets/banner_mens.png";
import men_banner1 from "./Components/Assets/banner_mens1.png";
import men_banner2 from "./Components/Assets/banner_mens2.png";
import kid_banner from "./Components/Assets/banner_kids.png";
import LoginSignup from "./Pages/LoginSignup";
import Checkout from "./Pages/Checkout/Checkout";
import Profile from "./Pages/Profile/Profile";

export const backend_url = 'http://localhost:4000';
export const currency = 'LKR ';

function App() {

  return (
 <div>
      <GoogleOAuthProvider clientId="693959344684-549u30r3prgohjhli9qdefgp6fcabqha.apps.googleusercontent.com">
      <SocketProvider>
      <Router>
        <Navbar />
       <PageTransition>
            <Routes>
              <Route path="/" element={<Shop gender="all" />} />
              <Route path="/mens" element={<ShopCategory banners={[men_banner, men_banner1, men_banner2]} category="men" />} />
             <Route path="/womens" element={<ShopCategory banners={[women_banner, women_banner1, women_banner2]} category="women" />} />
              <Route path="/kids" element={<ShopCategory banner={kid_banner} category="kid" />} />
              <Route path='/product' element={<Product />}>
                <Route path=':productId' element={<Product />} />
              </Route>
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<LoginSignup/>} />
            </Routes>
          </PageTransition>
       <Footer />
        <Chatbot />
        <PromoPopup />
      </Router>
      </SocketProvider>
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
