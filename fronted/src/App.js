import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LocationPage from "./components/LocationPage";
import ComplaintForm from "./components/ComplaintForm";
import Home from "./page/Home";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/location" element={<LocationPage />} />
        <Route path="/complainform" element={<ComplaintForm />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
