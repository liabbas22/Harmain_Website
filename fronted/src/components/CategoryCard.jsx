import React, { useEffect, useState } from "react";
import ModalDetailsPage from "./ModalDetailsPage";
import OfferBadge from "./OfferBadge";
import api from "../api";
import { ensureActiveCustomer } from "../utils/customerAccess";

const CategoryCard = ({ item }) => {
  const [modelVisible, setModelVisible] = useState(false);
  const [modalAnimation, setModalAnimation] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(item?.options?.[0]);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [toast, setToast] = useState(false);
  const isOutOfStock = item?.isOutOfStock === true || Number(item?.stock) <= 0;
  const isAvailable = item?.isAvailable !== false && !isOutOfStock;
  const availabilityLabel = isOutOfStock
    ? "Stock out"
    : item?.unavailableReason || "Unavailable";

  const handleOpenModal = () => {
    setQuantity(1);
    setSelectedOption(item?.options?.[0]);
    setSelectedAddOns([]);
    setSpecialInstructions("");
    setModelVisible(true);

    setTimeout(() => {
      setModalAnimation(true);
    }, 10);
  };

  const handleCloseModal = () => {
    setModalAnimation(false);

    setTimeout(() => {
      setModelVisible(false);
    }, 300);
  };

  const addToCart = async (
    event,
    quantity = 1,
    selectedOption = item?.options?.[0],
    instructions = "",
    addOns = [],
  ) => {
    event?.stopPropagation();
    if (!isAvailable) return;
    if (!localStorage.getItem("harmain_token"))
      return window.location.assign("/login");
    const access = await ensureActiveCustomer();
    if (!access.ok) {
      if (access.reason === "blocked") handleCloseModal();
      return;
    }
    try {
      await api.post("/cart", {
        productId: item.id,
        quantity,
        optionName: selectedOption?.name || "",
        specialInstructions: instructions,
        addOns: addOns.map((addOn) => addOn._id || addOn.name),
      });
      window.dispatchEvent(new Event("harmain-cart-updated"));
      handleCloseModal();
      setToast(true);
      window.setTimeout(() => setToast(false), 2600);
    } catch (error) {
      alert(error.response?.data?.message || "Could not add item to cart");
    }
  };

  useEffect(() => {
    if (modelVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modelVisible]);

  return (
    <>
      {toast && (
        <div className="fixed top-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white shadow-xl">
          <span className="grid w-5 h-5 text-xs text-green-700 bg-white rounded-full place-items-center">
            OK
          </span>
          {item?.title} added to cart successfully
        </div>
      )}
      <div
        id={`product-${item?.id}`}
        className="relative flex items-center gap-4 p-3 transition-all duration-500 ease-in-out shadow-sm cursor-pointer bg-gray-50 rounded-2xl hover:shadow-md group hover:scale-[1.02] hover:bg-red-100"
        onClick={handleOpenModal}
      >
        {!isAvailable && (
          <span className="absolute top-3 right-3 z-10 rounded-md bg-red-700 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
            {availabilityLabel}
          </span>
        )}
        <OfferBadge
          offer={item?.activeOffer}
          compact
          className="absolute z-10 left-3 top-3"
        />

        <div className="overflow-hidden w-28 h-28 md:w-40 md:h-40 rounded-xl">
          <img
            src={item?.image}
            alt={item?.title || "Item Image"}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        <div className="flex flex-col justify-between flex-1 h-full">
          <h2 className="text-sm font-extrabold tracking-wide text-gray-800 md:text-lg">
            {item?.title || "Item Name"}
          </h2>

          <p className="mt-1 text-xs leading-5 text-gray-500 md:text-sm line-clamp-2">
            {item?.description}
          </p>

          <div className="flex flex-col gap-2 mt-3 text-sm">
            {item?.options?.length > 0 ? (
              item?.options[0]?.discountPrice ? (
                <div className="inline-flex flex-wrap items-center gap-2 px-2 py-1 rounded-lg w-fit bg-red-50">
                  <span className="text-gray-400 line-through">
                    Rs. {item?.options[0]?.actualPrice}
                  </span>

                  <span className="text-[16px] font-bold text-gray-800">
                    Rs. {item?.options[0]?.discountPrice}
                  </span>
                </div>
              ) : (
                <span className="px-2 py-1 text-lg font-bold text-gray-800 rounded-lg w-fit bg-red-50">
                  Rs. {item?.options[0]?.actualPrice}
                </span>
              )
            ) : item?.discountprice ? (
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg w-fit bg-red-50">
                <span className="text-gray-400 line-through">
                  Rs. {item?.actualprice}
                </span>

                <span className="font-semibold text-gray-800">
                  Rs. {item?.discountprice}
                </span>
              </div>
            ) : (
              <span className="px-2 py-1 font-semibold text-gray-800 rounded-lg w-fit bg-red-50">
                Rs. {item?.actualprice}
              </span>
            )}

            <button
              disabled={!isAvailable}
              onClick={addToCart}
              className="px-4 py-1 text-sm font-bold text-white transition-all duration-300 ease-in-out bg-red-700 rounded-md md:px-6 lg:py-2 lg:px-6 hover:bg-red-800 hover:shadow-md w-fit disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:hover:shadow-none"
            >
              {isAvailable ? "Add to Cart" : availabilityLabel}
            </button>
          </div>
        </div>
      </div>

      {modelVisible && (
        <ModalDetailsPage
          modalAnimation={modalAnimation}
          item={item}
          setQuantity={setQuantity}
          quantity={quantity}
          specialInstructions={specialInstructions}
          setSpecialInstructions={setSpecialInstructions}
          handleCloseModal={handleCloseModal}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          selectedAddOns={selectedAddOns}
          setSelectedAddOns={setSelectedAddOns}
          onAddToCart={() =>
            addToCart(
              null,
              quantity,
              selectedOption,
              specialInstructions,
              selectedAddOns,
            )
          }
        />
      )}
    </>
  );
};

export default CategoryCard;
