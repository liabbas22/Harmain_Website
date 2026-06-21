import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { categories } from "../Data/data.js";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

import "swiper/css";
import Title from "./Title.jsx";

const Category = () => {
  const swiperRef = useRef(null);
  const [showStickyCategory, setShowStickyCategory] = useState(false);
  useEffect(() => {

    const handleScroll = () => {

      const scrollY = window.scrollY;
      if (scrollY >= 900 && !showStickyCategory) {
        setShowStickyCategory(true);
      }
      if (scrollY < 900 && showStickyCategory) {
        setShowStickyCategory(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };

  }, [showStickyCategory]);

  return (
    <>
      <div
        className={`fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-md transition-all duration-300
        ${
          showStickyCategory
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
      >

        <div className="px-4 py-3 md:px-6 lg:px-8">

          <Swiper
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            spaceBetween={10}
            slidesPerView={4}
            breakpoints={{
              0: { slidesPerView: 3 },
              480: { slidesPerView: 4 },
              768: { slidesPerView: 6 },
              1024: { slidesPerView: 8 },
              1280: { slidesPerView: 10 },
            }}
          >
            {categories?.map((cat) => {
              const Icon = cat.icon;

              return (
                <SwiperSlide key={cat.id}>

                  <div
                    className="flex flex-col items-center justify-center p-2 transition-all duration-300 bg-white border border-red-100 cursor-pointer rounded-xl hover:bg-red-700 group"
                  >

                    <Icon className="text-xl text-red-600 transition-all duration-300 md:text-2xl group-hover:text-white group-hover:scale-110" />

                    <p className="mt-1 text-[10px] md:text-xs font-medium text-gray-700 transition-all duration-300 group-hover:text-white">
                      {cat.title}
                    </p>

                  </div>

                </SwiperSlide>
              );
            })}
          </Swiper>

        </div>
      </div>

      <div className="relative w-full px-4 py-3 md:py-6 md:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-2 md:mb-4">

          <Title title={"Categories"} />

          <div className="flex gap-2">

            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="flex items-center justify-center w-8 h-8 text-white transition-all duration-300 bg-red-600 rounded-full hover:bg-red-700 hover:scale-105"
            >
              <FaChevronLeft size={12} />
            </button>

            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="flex items-center justify-center w-8 h-8 text-white transition-all duration-300 bg-red-600 rounded-full hover:bg-red-700 hover:scale-105"
            >
              <FaChevronRight size={12} />
            </button>

          </div>
        </div>

        <Swiper
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          spaceBetween={12}
          slidesPerView={4}
          breakpoints={{
            0: { slidesPerView: 3 },
            480: { slidesPerView: 4 },
            768: { slidesPerView: 7 },
            1024: { slidesPerView: 9 },
            1280: { slidesPerView: 12 },
          }}
        >
          {categories?.map((cat) => {
            const Icon = cat.icon;

            return (
              <SwiperSlide key={cat.id}>

                <div
                  className="flex flex-col items-center justify-center p-3 transition-all duration-300 bg-white shadow-sm cursor-pointer rounded-xl hover:shadow-lg group hover:bg-red-700 active:scale-95"
                >

                  <Icon className="text-2xl text-red-600 transition-all duration-300 lg:w-10 lg:h-10 md:text-3xl group-hover:text-white group-hover:scale-110" />

                  <p className="mt-2 text-xs font-medium text-center text-gray-700 transition-all duration-300 md:text-sm group-hover:text-white">
                    {cat.title}
                  </p>

                </div>

              </SwiperSlide>
            );
          })}
        </Swiper>

      </div>
    </>
  );
};

export default Category;