import React from "react";
import { FaFire } from "react-icons/fa";
import { PopularItemData } from "../Data/data";
import PopularItemCards from "./PopularItemCards";

const PopularItem = () => {
  return (
    <div>
      <div className="flex flex-col gap-1 py-2 mb-2 lg:py-4 md:mb-3">
        <h1 className="flex gap-1 font-semibold font-roboto">
          <FaFire className="text-xl text-red-500" />
          Popular Items
        </h1>
        <h2 className="font-serif">Most ordered right now</h2>
      </div>

      <div className="grid items-center grid-cols-2 gap-4 md:grid-cols-4">
        {PopularItemData?.map((item, index) => (
          <div key={index}>
            <PopularItemCards item={item} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularItem;
