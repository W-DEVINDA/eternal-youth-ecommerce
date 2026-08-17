import { BrowserRouter } from "react-router-dom";
import Footer from "./Components/Footer/Footer";
import Navbar from "./Components/Navbar/Navbar";
import Admin from "./Pages/Admin";
import { SocketProvider } from "./Context/SocketContext";
export const backend_url = 'http://localhost:4000';
export const currency = "LKR ";

function App() {
  return (
    <BrowserRouter>
     <div>
      <SocketProvider>
        <Navbar />
        <Admin />
        <Footer />
      </SocketProvider>
    </div>
    </BrowserRouter>
  );
}

export default App;
