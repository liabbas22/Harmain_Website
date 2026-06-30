import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import { AssetsData } from "../assets/assets";
import api from "../api";

const slides = [
  {
    img: AssetsData.Banner1,
  },
  {
    img: AssetsData.Banner2,
  },
  {
    img: AssetsData.Banner3,
  },
];

const Herosection = () => {
  const [backendSlides, setBackendSlides] = useState([]);

  useEffect(() => {
    let mounted = true;
    api
      .get("/banners")
      .then((response) => {
        const banners = response.data?.banners || [];
        if (mounted && banners.length) setBackendSlides(banners);
      })
      .catch(() => {
        if (mounted) setBackendSlides([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const displaySlides = useMemo(
    () => (backendSlides.length ? backendSlides : slides),
    [backendSlides],
  );

  return (
    <div className="w-full">
      <div className="px-2 pt-2 md:pt-6 md:px-6 lg:px-8">

        <Swiper
          slidesPerView={1}
          spaceBetween={20}
          loop={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{ clickable: true }}
          navigation={true}
          modules={[Pagination, Navigation, Autoplay]}
          className="hero-swiper overflow-hidden shadow-lg rounded-xl"
        >

          {displaySlides?.map((item, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full h-[180px] sm:h-[250px] md:h-[350px] lg:h-[580px]">

                <img
                  src={item.image || item.img}
                  alt={item.title || "Harmain Restaurant banner"}
                  className="object-cover w-full h-full"
                />

                <div className="absolute inset-0 flex flex-col items-start justify-center px-4 md:px-6 bg-black/30">
                  {(item.badge || item.title || item.subtitle || item.ctaLabel) && (
                    <div className="max-w-xl text-white">
                      {item.badge && (
                        <span className="inline-flex rounded-full bg-red-700 px-4 py-1 text-[11px] font-extrabold uppercase tracking-widest shadow-lg">
                          {item.badge}
                        </span>
                      )}
                      {item.title && (
                        <h1 className="mt-3 text-2xl font-extrabold leading-tight drop-shadow md:text-5xl">
                          {item.title}
                        </h1>
                      )}
                      {item.subtitle && (
                        <p className="mt-3 max-w-lg text-sm font-semibold leading-6 text-white/90 md:text-lg">
                          {item.subtitle}
                        </p>
                      )}
                      {item.ctaLabel && item.ctaLink && (
                        <a
                          href={item.ctaLink}
                          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-red-700 px-6 text-sm font-extrabold text-white shadow-xl transition hover:bg-red-600"
                        >
                          {item.ctaLabel}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="absolute flex flex-col gap-1 px-2 py-1 rounded-lg shadow-md bottom-2 right-1 md:bottom-3 md:right-2 md:px-3 md:py-2 bg-white/90 backdrop-blur-md">

                  <h1 className="text-[10px] md:text-xs font-bold tracking-wider md:tracking-widest text-red-700 uppercase">
                    Secure Payments
                  </h1>

                  <div className="flex items-center gap-1 md:gap-2">
                    <img
                      src={AssetsData?.visa}
                      alt="visa"
                      className="w-10 h-auto md:w-12 lg:w-16"
                    />
                    <img
                      src={AssetsData?.master}
                      alt="master"
                      className="w-10 h-auto md:w-12 lg:w-16"
                    />
                  </div>

                </div>

              </div>
            </SwiperSlide>
          ))}

        </Swiper>

      </div>
    </div>
  );
};

export default Herosection;
