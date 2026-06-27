import React from "react";
import { FaShareAlt } from "react-icons/fa";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa6";
import { IoMdArrowRoundForward, IoMdClose } from "react-icons/io";
import OfferBadge from "./OfferBadge";

const ModalDetailsPage = ({
  modalAnimation,
  handleCloseModal,
  item,
  selectedOption,
  setSelectedOption,
  selectedAddOns = [],
  setSelectedAddOns,
  quantity,
  setQuantity,
  specialInstructions,
  setSpecialInstructions,
  onAddToCart,
}) => {
  const isOutOfStock = item?.isOutOfStock === true || Number(item?.stock) <= 0;
  const isAvailable = item?.isAvailable !== false && !isOutOfStock;
  const availabilityLabel = isOutOfStock
    ? "Stock out"
    : item?.unavailableReason || "Unavailable";
  const availableAddOns = (item?.addOns || []).filter(
    (addOn) => addOn.isAvailable !== false,
  );
  const comboItems = item?.isComboMeal
    ? (item?.comboItems || []).filter(
        (comboItem) => comboItem.product || comboItem.productName || comboItem.label,
      )
    : [];
  const selectedAddOnIds = new Set(
    selectedAddOns.map((addOn) => String(addOn._id || addOn.name)),
  );
  const optionPrice =
    selectedOption?.discountPrice ||
    selectedOption?.actualPrice ||
    item?.actualprice ||
    0;
  const addOnTotal = selectedAddOns.reduce(
    (sum, addOn) => sum + Number(addOn.price || 0),
    0,
  );
  const unitTotal = Number(optionPrice || 0) + addOnTotal;
  const toggleAddOn = (addOn) => {
    if (!setSelectedAddOns) return;
    const key = String(addOn._id || addOn.name);
    setSelectedAddOns(
      selectedAddOnIds.has(key)
        ? selectedAddOns.filter(
            (entry) => String(entry._id || entry.name) !== key,
          )
        : [...selectedAddOns, addOn],
    );
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 transition-all duration-300 ${
        modalAnimation ? "bg-black/50 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={handleCloseModal}
    >
      <div
        className={`relative w-full max-w-6xl rounded-lg bg-white md:rounded-xl lg:rounded-3xl shadow-2xl transition-all duration-300 max-h-[90vh] overflow-y-auto lg:overflow-hidden lg:max-h-none ${
          modalAnimation ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-10"
        }`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="grid grid-cols-1 overflow-hidden lg:grid-cols-2">
          <div className="relative">
            <img
              src={item?.image}
              alt={item?.title}
              className="object-cover w-full h-full"
            />

            <OfferBadge offer={item?.activeOffer} className="absolute left-4 top-4 z-40" />

            <div
              className="absolute z-50 flex items-center gap-3 top-4 right-3 md:top-4 md:right-4 lg:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="flex items-center justify-center w-10 h-10 text-gray-200 transition-all bg-red-700 rounded-full shadow-lg md:w-12 md:h-12 hover:bg-red-600">
                <FaShareAlt />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseModal();
                }}
                className="flex items-center justify-center w-10 h-10 text-gray-200 transition-all bg-red-700 rounded-full shadow-lg md:w-12 md:h-12 hover:bg-red-600"
              >
                <IoMdClose />
              </button>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

            <div className="absolute bottom-0 left-0 p-6">
              <h2 className="text-2xl font-extrabold text-white md:text-3xl">
                {item?.title}
              </h2>

              <p className="max-w-lg mt-1 text-sm leading-7 text-gray-200 md:mt-3 md:text-lg">
                {item?.description}
              </p>
            </div>
          </div>

          <div className="relative flex flex-col bg-white">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
                  Rs.{" "}
                  {unitTotal}
                </h2>

                {selectedOption?.actualPrice &&
                  selectedOption?.discountPrice && (
                    <span className="text-2xl font-bold text-gray-400 line-through">
                      Rs. {selectedOption?.actualPrice}
                    </span>
                  )}
              </div>

              {!isAvailable && <span className="rounded-md bg-red-700 px-2 py-1 text-xs font-extrabold uppercase tracking-wide text-white">{availabilityLabel}</span>}

              <div className="items-center hidden gap-3 lg:flex">
                <button className="flex items-center justify-center w-12 h-12 text-white transition-all bg-red-700 rounded-full shadow-lg hover:bg-red-600">
                  <FaShareAlt />
                </button>

                <button
                  onClick={handleCloseModal}
                  className="flex items-center justify-center w-12 h-12 text-white transition-all bg-red-700 rounded-full shadow-lg hover:bg-red-600"
                >
                  <IoMdClose />
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              <h3 className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                Choose An Option
              </h3>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {item?.options?.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedOption(option)}
                    className={`border rounded-2xl p-2 cursor-pointer transition-all duration-300 ${
                      selectedOption === option
                        ? "border-red-600 bg-red-50 shadow-md"
                        : "border-gray-200 hover:border-red-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center ${
                          selectedOption === option
                            ? "border-red-600"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedOption === option && (
                          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-sans text-sm font-bold tracking-wider text-red-600">
                          {option?.name}
                        </h4>

                        <p className="text-sm font-bold text-gray-900">
                          Rs. {option?.discountPrice || option?.actualPrice}
                        </p>

                        {option?.discountPrice && (
                          <span className="text-xs font-semibold text-gray-400 line-through">
                            Rs. {option?.actualPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {comboItems.length > 0 && (
                <div className="mt-8">
                  <h3 className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                    Combo Includes
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {comboItems.map((comboItem, index) => {
                      const comboProduct = comboItem.product || {};
                      const name =
                        comboProduct.name ||
                        comboItem.productName ||
                        comboItem.label ||
                        "Combo item";
                      const optionName = comboItem.optionName
                        ? ` - ${comboItem.optionName}`
                        : "";
                      return (
                        <div
                          key={`${comboProduct._id || comboItem.product || name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 p-3"
                        >
                          <span className="min-w-0">
                            <b className="block truncate text-sm text-gray-900">
                              {name}
                              {optionName}
                            </b>
                            <small className="mt-1 block text-xs font-bold text-red-700">
                              Qty x{comboItem.quantity || 1}
                            </small>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {availableAddOns.length > 0 && (
                <div className="mt-8">
                  <h3 className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                    Add-ons
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {availableAddOns.map((addOn) => {
                      const key = String(addOn._id || addOn.name);
                      const active = selectedAddOnIds.has(key);
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => toggleAddOn(addOn)}
                          className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition ${
                            active
                              ? "border-red-600 bg-red-50 shadow-md"
                              : "border-gray-200 hover:border-red-300"
                          }`}
                        >
                          <span className="min-w-0">
                            <b className="block truncate text-sm text-gray-900">
                              {addOn.name}
                            </b>
                            <small className="mt-1 block text-xs font-bold text-red-700">
                              + Rs. {addOn.price}
                            </small>
                          </span>
                          <span
                            className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
                              active
                                ? "border-red-600 bg-red-600"
                                : "border-gray-300"
                            }`}
                          >
                            {active && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <h3 className="mb-2 font-sans text-[16px] font-bold text-gray-600">
                  Special Instructions
                </h3>

                <textarea
                  value={specialInstructions}
                  onChange={(event) => setSpecialInstructions(event.target.value)}
                  maxLength={500}
                  placeholder="Please enter instructions about this item"
                  className="w-full p-2 md:p-3 font-sans text-[16px] border-2 border-gray-200 resize-none h-28 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
                ></textarea>
              </div>
            </div>

            <div className="sticky bottom-0 left-0 z-40 flex items-center justify-between gap-2 p-3 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)] overflow-y-auto">
              <div className="flex items-center overflow-hidden border-2 border-red-100 rounded-xl md:rounded-full bg-red-50">
                <button
                  className="flex items-center justify-center w-10 h-10 text-red-700 transition-all duration-200 hover:bg-red-100"
                  onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                >
                  {quantity === 1 ? (
                    <span className="p-1 bg-white border border-red-300 rounded-full shadow-sm">
                      <FaTrash className="text-xs" />
                    </span>
                  ) : (
                    <span className="p-1 bg-white border border-red-300 rounded-full shadow-sm">
                      <FaMinus className="text-xs" />
                    </span>
                  )}
                </button>

                <span className="w-8 text-sm font-bold text-center md:w-10 md:text-base">
                  {quantity}
                </span>

                <button
                  className="flex items-center justify-center w-10 h-10 transition-all duration-200 hover:bg-red-100"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <span className="p-1 text-white bg-red-700 border border-red-300 rounded-full shadow-sm">
                    <FaPlus className="text-xs" />
                  </span>
                </button>
              </div>

              <button disabled={!isAvailable} onClick={() => isAvailable && onAddToCart?.()} className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-bold text-white transition-all duration-300 bg-red-700 rounded-lg shadow-lg group md:px-10 hover:bg-red-600 whitespace-nowrap w-fit disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:shadow-none">
                <span>
                  Rs. {unitTotal * quantity}
                </span>

                <span className="opacity-50">|</span>

                <span className="flex items-center gap-3">{isAvailable ? <>Add to Cart<span className="transition-all duration-200 group-hover:translate-x-1"><IoMdArrowRoundForward className="w-4 h-4" /></span></> : availabilityLabel}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetailsPage;
