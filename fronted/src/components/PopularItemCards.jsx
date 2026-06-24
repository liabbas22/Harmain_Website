import React, { useEffect, useState } from "react";
import ModalDetailsPage from "./ModalDetailsPage";
import api from "../api";

const PopularItemCards = ({ item }) => {
  const [modelVisible, setModelVisible] = useState(false);
  const [modalAnimation, setModalAnimation] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(item?.options?.[0]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [toast, setToast] = useState(false);
  const isAvailable = item?.isAvailable !== false;

  const handleOpenModal = () => {
    setQuantity(1);
    setSelectedOption(item?.options?.[0]);
    setSpecialInstructions("");
    setModelVisible(true);
    setTimeout(() => setModalAnimation(true), 10);
  };
  const handleCloseModal = () => {
    setModalAnimation(false);
    setTimeout(() => setModelVisible(false), 300);
  };
  const addToCart = async () => {
    if (!isAvailable) return;
    if (!localStorage.getItem("harmain_token")) return window.location.assign("/login");
    try {
      await api.post("/cart", { productId: item.id, quantity, optionName: selectedOption?.name || "", specialInstructions });
      window.dispatchEvent(new Event("harmain-cart-updated"));
      handleCloseModal();
      setToast(true);
      window.setTimeout(() => setToast(false), 2600);
    } catch (error) {
      alert(error.response?.data?.message || "Could not add item to cart");
    }
  };

  useEffect(() => {
    document.body.style.overflow = modelVisible ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [modelVisible]);

  return <>{toast && <div className="fixed top-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white shadow-xl"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs text-green-700">OK</span>{item?.title} added to cart successfully</div>}<div className="overflow-hidden transition-all duration-300 bg-white shadow-sm cursor-pointer rounded-xl hover:shadow-lg group" onClick={handleOpenModal}><div className="relative w-full h-48 overflow-hidden md:h-52 lg:h-60 rounded-xl"><img src={item?.image} alt={item?.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"/><div className="absolute inset-0 bg-black/50 group-hover:bg-black/30"/>{!isAvailable && <span className="absolute top-3 right-3 rounded-md bg-red-700 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">Unavailable</span>}<h3 className="absolute text-sm font-bold tracking-wide text-white top-3 left-3 right-3 md:text-base lg:text-lg line-clamp-2">{item?.title}</h3><div className="absolute bottom-3 right-2 lg:right-3">{item?.options?.[0]?.discountPrice ? <div className="flex items-center gap-2 px-3 py-1 text-xs bg-white rounded-md shadow-xl md:text-sm backdrop-blur-sm"><span className="line-through text-black/40">Rs {item?.options?.[0]?.actualPrice}</span><span className="text-sm font-bold text-red-500 md:text-lg">Rs {item?.options?.[0]?.discountPrice}</span></div> : <div className="px-3 py-2 text-xs bg-white rounded-md shadow-lg md:text-sm backdrop-blur-sm"><span className="font-bold text-red-500">Rs {item?.options?.[0]?.actualPrice}</span></div>}</div></div></div>{modelVisible && <ModalDetailsPage modalAnimation={modalAnimation} item={item} setQuantity={setQuantity} quantity={quantity} specialInstructions={specialInstructions} setSpecialInstructions={setSpecialInstructions} handleCloseModal={handleCloseModal} selectedOption={selectedOption} setSelectedOption={setSelectedOption} onAddToCart={addToCart}/>}</>;
};

export default PopularItemCards;
