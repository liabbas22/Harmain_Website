import React, { useEffect, useState } from "react";
import ModalDetailsPage from "./ModalDetailsPage";

const PopularItemCards = ({ item }) => {
  const [modelVisible, setModelVisible] = useState(false);
  const [modalAnimation, setModalAnimation] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(item?.options?.[0]);

  const handleOpenModal = () => {
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
      <div
        className="overflow-hidden transition-all duration-300 bg-white shadow-sm cursor-pointer rounded-xl hover:shadow-lg group"
        onClick={handleOpenModal}
      >
        <div className="relative w-full h-48 overflow-hidden md:h-52 lg:h-60 rounded-xl">
          <img
            src={item?.image}
            alt={item?.title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30" />
          <h3 className="absolute text-sm font-bold tracking-wide text-white top-3 left-3 right-3 md:text-base lg:text-lg line-clamp-2">
            {item?.title}
          </h3>

          <div className="absolute bottom-3 right-2 lg:right-3">
            {item?.options?.[0]?.discountPrice ? (
              <div className="flex items-center gap-2 px-3 py-1 text-xs bg-white rounded-md shadow-xl md:text-sm backdrop-blur-sm">
                <span className="hidden font-medium text-black/70 lg:block">
                  From
                </span>

                <span className="line-through text-black/40">
                  Rs {item?.options?.[0]?.actualPrice}
                </span>

                <span className="text-sm font-bold text-red-500 md:text-lg">
                  Rs {item?.options?.[0]?.discountPrice}
                </span>
              </div>
            ) : (
              <div className="px-3 py-2 text-xs bg-white rounded-md shadow-lg md:text-sm backdrop-blur-sm">
                <span className="font-bold text-red-500">
                  Rs {item?.options?.[0]?.actualPrice}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {modelVisible && (
        <ModalDetailsPage
          modalAnimation={modalAnimation}
          item={item}
          setQuantity={setQuantity}
          quantity={quantity}
          handleCloseModal={handleCloseModal}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
        />
      )}
    </>
  );
};

export default PopularItemCards;
