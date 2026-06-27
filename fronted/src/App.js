import { BrowserRouter, Route, Routes } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LocationPage from "./components/LocationPage";
import ComplaintForm from "./components/ComplaintForm";
import Home from "./page/Home";
import Auth from "./page/Auth";
import Cart from "./page/Cart";
import Checkout from "./page/Checkout";
import CustomerAccount from "./page/CustomerAccount";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/location" element={<LocationPage />} />
        <Route path="/complainform" element={<ComplaintForm />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<CustomerAccount />} />
        <Route path="/orders" element={<CustomerAccount />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
export default App;
