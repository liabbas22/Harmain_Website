import { MdOutlineWhatsapp } from "react-icons/md";
import {
  FaArrowRight,
  FaArrowUp,
  FaLocationArrow,
  FaLocationDot,
  FaPhone,
} from "react-icons/fa6";
import { AssetsData } from "../assets/assets";
import { IoMenu } from "react-icons/io5";
import { BsCartFill } from "react-icons/bs";
import { useEffect, useState } from "react";
import { areas, Branch } from "../Data/data";
import { RiShoppingBag3Fill } from "react-icons/ri";
import { IoMdClose, IoMdSearch } from "react-icons/io";
import { FiMessageSquare, FiUser } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [orderSelection, setOrderSelection] = useState(false);
  const [deliveryButton, setDeliveryButton] = useState(true);
  const [pickupButton, setPickupButton] = useState(false);
  const [cartModel, setCartModel] = useState(false);
  const [menuBar, setMenuBar] = useState(false);
  const [menuBarVisible, setMenuBarVisible] = useState(false);

  const [showButtons, setShowButtons] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("harmain_user") || "null"));

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("harmain_user") || "null"));
    } catch {
      setUser(null);
    }
  }, [location.pathname]);

  const orderAmount = 900;

  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname === "/") {
        setShowButtons(window.scrollY > 200);
      } else {
        setShowButtons(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  const HandleDeliveryButton = () => {
    setPickupButton(false);
    setDeliveryButton(true);
  };

  const HandlePickUpButton = () => {
    setDeliveryButton(false);
    setPickupButton(true);
  };

  const handleCart = () => {
    setCartModel(true);
  };

  const handleMenuBar = () => {
    setMenuBar(true);
    setTimeout(() => setMenuBarVisible(true), 10);
  };
  const handleCloseMenu = () => {
    setMenuBarVisible(false);
    setTimeout(() => setMenuBar(false), 300);
  };
  const handleLogout = () => { localStorage.removeItem("harmain_token"); localStorage.removeItem("harmain_user"); setUser(null); handleCloseMenu(); navigate("/"); };

  useEffect(() => {
    if (orderSelection || cartModel || menuBar) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [orderSelection, cartModel, menuBar]);

  return (
    <div className="relative border-b-2 border-red-700">
      <div className="flex items-center justify-between px-4 py-1 md:py-3 md:px-8">
        <div className="items-center hidden gap-3 md:flex">
          <div
            className="flex items-center gap-2 px-3 h-11 min-w-[160px]
            bg-red-700 text-white rounded-lg hover:px-4 hover:shadow-md cursor-pointer transition-all duration-300"
            onClick={() => setOrderSelection(!orderSelection)}
          >
            <FaLocationDot className="text-lg" />
            <div>
              <h3 className="font-sans text-sm font-medium">Change Branch</h3>
              <p className="text-[11px] text-white/80 font-sans">
                Harmain Sharfain
              </p>
            </div>
          </div>

          <a
            className="flex items-center gap-2 px-4 h-11 min-w-[160px]
            bg-red-700 text-white rounded-lg hover:px-5 hover:shadow-md transition-all"
            href="https://web.whatsapp.com/"
          >
            <MdOutlineWhatsapp />
            <p className="text-sm font-medium">0213 8892342</p>
          </a>
        </div>

        <Link to={"/"}>
          <div className="z-10 flex justify-start flex-1 md:absolute md:left-1/2 md:top-0">
            <img
              src={AssetsData.logo}
              alt="logo"
              className="w-16 h-16 bg-white rounded-full cursor-pointer md:w-24 md:h-24"
            />
          </div>
        </Link>

        <div className="flex items-center gap-2 text-red-700">
          <div className="flex items-center gap-3 md:hidden">
            <span className="p-2 bg-red-100 rounded-full">
              <FaLocationDot
                className="text-xl"
                onClick={() => setOrderSelection(!orderSelection)}
              />
            </span>

            <a
              className="p-2 bg-red-100 rounded-full"
              href="https://web.whatsapp.com/"
            >
              <FaPhone className="text-xl" />
            </a>
          </div>

          <button
            className="relative p-2 text-xl rounded-full hover:bg-red-100"
            onClick={handleCart}
          >
            <BsCartFill />
            <span className="absolute top-[2px] right-[2px] w-4 h-4 text-[9px] bg-red-700 text-white rounded-full flex items-center justify-center border border-white">
              0
            </span>
          </button>

          <button
            className="p-2 text-xl text-white bg-red-700 rounded-md"
            onClick={handleMenuBar}
          >
            <IoMenu />
          </button>
        </div>
      </div>
      {orderSelection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-3 bg-black/40 backdrop-blur-sm"
          onClick={() => setOrderSelection(false)}
        >
          <div
            className="relative w-full max-w-md p-5 bg-white shadow-xl rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOrderSelection(false)}
              className="absolute text-gray-500 top-3 right-3 hover:text-black"
            >
              ✕
            </button>

            <div className="flex justify-center">
              <img
                src={AssetsData.logo}
                alt="logo"
                className="rounded-full shadow w-14 h-14"
              />
            </div>

            <h3 className="mt-3 text-base font-bold text-center text-gray-800">
              Select Your Order Type
            </h3>

            <div className="flex p-1 mt-4 bg-gray-100 rounded-full">
              <button
                onClick={HandleDeliveryButton}
                className={`flex-1 py-2 text-sm rounded-full transition-all duration-300 ${
                  deliveryButton
                    ? "bg-red-700 text-white shadow"
                    : "text-gray-700"
                }`}
              >
                Delivery
              </button>

              <button
                onClick={HandlePickUpButton}
                className={`flex-1 py-2 text-sm rounded-full transition-all duration-300 ${
                  pickupButton
                    ? "bg-red-700 text-white shadow"
                    : "text-gray-700"
                }`}
              >
                Pickup
              </button>
            </div>

            {/* DELIVERY */}
            {deliveryButton && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-center text-gray-900">
                  Please select your delivery location
                </p>

                <div className="flex items-center gap-2 p-3 transition border rounded-lg cursor-pointer hover:bg-gray-50">
                  <FaLocationArrow className="text-red-600" />
                  <span className="text-sm font-medium">
                    Use Current Location
                  </span>
                </div>

                <select className="w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option>Select Area</option>
                  {areas.map((area) => (
                    <option key={area.id}>{area.name}</option>
                  ))}
                </select>

                <button
                  className="w-full py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                  onClick={() => setOrderSelection(false)}
                >
                  Confirm Delivery
                </button>
              </div>
            )}

            {/* PICKUP */}
            {pickupButton && (
              <div className="mt-4 space-y-4">
                <div className="text-center">
                  <h3 className="text-base font-bold text-gray-800">
                    Select Your Pickup Branch
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose your nearest branch
                  </p>
                </div>

                <select className="w-full p-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option>Select Branch</option>
                  {Branch.map((b) => (
                    <option key={b.id}>{b.name}</option>
                  ))}
                </select>

                {/* 🔥 SAME LOCATION CARD */}
                <div className="flex gap-3 p-4 transition-all duration-300 border border-red-100 shadow-sm rounded-2xl bg-gradient-to-br from-red-50 to-white hover:shadow-md">
                  <div className="flex items-start">
                    <span className="flex items-center justify-center bg-red-100 rounded-full w-11 h-11">
                      <FaLocationDot className="text-xl text-red-600" />
                    </span>
                  </div>

                  <div className="flex flex-col flex-1 gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Harmain Sharfain Branch
                      </h4>

                      <p className="mt-1 text-xs leading-relaxed text-gray-600">
                        Harmain Sharfain Restaurant Bahadurabad Char Minar
                        Chowrangi, Opposite to KFC Near Habib Metro Bank
                      </p>
                    </div>

                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Harmain+Sharfain+Restaurant+Bahadurabad+Karachi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"
                    >
                      <FaLocationArrow />
                      Get Directions
                    </a>
                  </div>
                </div>

                <button
                  className="w-full py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 active:scale-[0.98]"
                  onClick={() => setOrderSelection(false)}
                >
                  Confirm Pickup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {cartModel && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCartModel(false)}
          ></div>

          <div
            className={`absolute top-0 right-0 h-full w-[90%] sm:w-[400px] bg-white shadow-xl
            transform transition-transform duration-300 animate-slideIn`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 bg-red-700">
              <div className="flex items-center gap-1">
                <RiShoppingBag3Fill className="w-5 h-5 text-gray-100" />
                <span className="font-medium text-gray-200">Your Cart</span>
              </div>

              <button
                onClick={() => setCartModel(false)}
                className="p-1 transition-all ease-in-out bg-red-500 border-2 border-gray-200 rounded-full hover:bg-red-400"
              >
                <IoMdClose className="w-5 h-5 text-gray-100" />
              </button>
            </div>

            <div className="absolute flex flex-col items-center gap-1 px-10 text-center bottom-1/4">
              <span className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full">
                <span className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm">
                  <RiShoppingBag3Fill className="w-8 h-8 text-red-700" />
                </span>
              </span>
              <h3 className="font-bold text-gray-700">Your cart is empty</h3>

              <p className="font-sans text-gray-500">
                Looks like you haven't added anything to your cart yet
              </p>

              <button className="px-4 py-2 mt-3 text-white bg-red-700 rounded-xl hover:bg-red-600 w-fit">
                Browse Products
              </button>
            </div>
          </div>
        </div>
      )}

      {menuBar && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
              menuBarVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={handleCloseMenu}
          ></div>

          <div
            className={`absolute top-0 right-0 h-full w-[90%] sm:w-[320px] bg-white shadow-2xl
      transform transition-transform duration-300 ${
        menuBarVisible ? "translate-x-0" : "translate-x-full"
      }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-red-700 to-red-600">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">
                  Harmain Sharfain
                </span>
                <span className="text-xs text-red-100">
                  Taste that feels like home
                </span>
              </div>

              <button
                onClick={handleCloseMenu}
                className="p-2 transition-all rounded-full bg-white/20 hover:bg-white/30"
              >
                <IoMdClose className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex flex-col gap-4 p-5">
              <Link to={"/location"}>
                <button
                  className="flex items-center w-full gap-3 px-4 py-3 transition-all duration-300 bg-red-50 rounded-xl hover:bg-red-100 group"
                  onClick={() => setMenuBarVisible(false)}
                >
                  <span className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full group-hover:bg-red-200">
                    <FaLocationDot className="w-5 h-5 text-red-700" />
                  </span>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-800">
                      Our Location
                    </span>
                    <span className="text-xs text-gray-500">
                      Find nearest branch
                    </span>
                  </div>
                </button>
              </Link>
              <Link to={"/complainform"}>
                <button
                  className="flex items-center w-full gap-3 px-4 py-3 transition-all duration-300 bg-red-50 rounded-xl hover:bg-red-100 group"
                  onClick={() => setMenuBarVisible(false)}
                >
                  <span className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full group-hover:bg-red-200">
                    <FiMessageSquare className="w-5 h-5 text-red-700" />
                  </span>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-800">
                      Complaint Form
                    </span>
                    <span className="text-xs text-gray-500">
                      Share your feedback
                    </span>
                  </div>
                </button>
              </Link>
              <div className="my-2 border-t"></div>
              <div className="border-b border-gray-200 pb-4">
                {user ? <div className="space-y-3"><div className="flex items-center gap-3 rounded-xl bg-red-50 p-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-700 font-bold text-white">{user.name?.[0]?.toUpperCase() || "U"}</span><div><p className="text-sm font-bold text-gray-800">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div></div><button onClick={handleLogout} className="w-full rounded-xl border border-red-200 py-3 text-sm font-bold text-red-700 hover:bg-red-50">Logout</button></div> : <div><Link to="/login" onClick={handleCloseMenu} className="flex items-center gap-3 rounded-xl bg-red-700 p-3 text-white"><FiUser /><span className="text-sm font-bold">Sign in</span></Link><Link to="/register" onClick={handleCloseMenu} className="mt-3 block text-center text-xs font-bold text-red-700">Create an account</Link></div>}
              </div>

              <div className="flex flex-col gap-2 px-2">
                <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Contact
                </span>

                <a
                  href="https://web.whatsapp.com/"
                  className="flex items-center gap-3 px-3 py-2 transition-all rounded-lg hover:bg-gray-100"
                >
                  <MdOutlineWhatsapp className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">WhatsApp</span>
                </a>

                <a
                  href="tel:02138892342"
                  className="flex items-center gap-3 px-3 py-2 transition-all rounded-lg hover:bg-gray-100"
                >
                  <FaPhone className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-gray-700">Call Us</span>
                </a>
              </div>
            </div>

            <div className="absolute bottom-0 w-full p-4 border-t bg-gray-50">
              <button className="w-full py-3 text-sm font-semibold text-white transition-all bg-red-700 rounded-xl hover:bg-red-600 active:scale-[0.98]">
                Order Now
              </button>
            </div>
          </div>
        </div>
      )}
      <a
        href="https://wa.me/03040635922"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed z-50 p-2 text-white transition-all bg-green-500 rounded-full shadow-lg outline-none cursor-pointer md:p-3 bottom-28 right-2 md:bottom-28 md:right-5 hover:bg-green-600"
      >
        <MdOutlineWhatsapp className="w-8 h-8" />
      </a>

      <div
        className={`fixed bg-white py-3 md:bg-transparent md:border-t-0 z-50 flex items-end md:items-center justify-between 
  w-full gap-2 md:gap-3 px-3 md:px-6 transition-all duration-500 ease-in-out
  bottom-[-1px] md:bottom-2 flex-wrap
  border-t border-gray-200
  shadow-[0_-4px_12px_rgba(0,0,0,0.08)]
  md:shadow-none
  ${
    showButtons
      ? "opacity-100 translate-y-0 scale-100"
      : "opacity-0 translate-y-24 scale-95 pointer-events-none"
  }`}
      >
        <span
          onClick={() => {
            document
              .getElementById("search-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className={`p-3 transition-all duration-500 bg-red-700 rounded-lg shadow-lg cursor-pointer md:p-4 hover:scale-105 ${
            showButtons
              ? "translate-x-0 opacity-100"
              : "-translate-x-10 opacity-0"
          }`}
        >
          <IoMdSearch className="w-5 h-5 text-white" />
        </span>

        <div
          className={`flex flex-col items-center gap-[6px] transition-all duration-500 delay-100 ${
            showButtons
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
          }`}
        >
          {orderAmount < 1000 && (
            <div className="px-0 md:px-7 py-[4px] font-sans rounded-full text-sm bg-transparent md:bg-gray-50/80 md:shadow-lg">
              <span className="font-semibold text-orange-400">
                You're{" "}
                <span className="font-extrabold text-red-700">Rs. 100</span>{" "}
                away from minimum order
              </span>
            </div>
          )}

          <div className="flex items-center w-full gap-4 px-3 py-[10px] transition-all bg-red-700 rounded-lg shadow-lg cursor-pointer md:px-6 md:w-fit md:py-4 md:gap-8 md:rounded-3xl hover:scale-105 group">
            <span className="px-2 font-bold text-red-700 bg-white rounded-full md:font-extrabold text-[16px]">
              1
            </span>

            <span className="text-[16px] tracking-wider font-bold md:font-extrabold text-gray-200 md:text-lg">
              View Cart
            </span>

            <span className="flex items-center text-[16px] font-extrabold text-gray-50">
              Rs.900
              <span className="px-4 font-extrabold text-gray-100 transition-all duration-300 ease-in-out md:text-lg group-hover:translate-x-5">
                <FaArrowRight />
              </span>
            </span>
          </div>
        </div>

        <span
          className={`hidden md:block p-4 transition-all duration-500 bg-red-700 shadow-lg cursor-pointer rounded-xl hover:scale-105 ${
            showButtons
              ? "translate-x-0 opacity-100"
              : "translate-x-10 opacity-0"
          }`}
          onClick={() => {
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }}
        >
          <FaArrowUp className="w-4 h-4 text-white" />
        </span>
      </div>

      <span
        className={`fixed z-40 p-3 bg-red-700 shadow-lg cursor-pointer bottom-[170px] right-3 md:hidden rounded-xl transition-all duration-500 hover:scale-105 ${
          showButtons
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        onClick={() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }}
      >
        <FaArrowUp className="w-5 h-5 text-white" />
      </span>
    </div>
  );
};

export default Navbar;
