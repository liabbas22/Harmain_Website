import React from "react";
import { categoriesData as staticCategoriesData } from "../Data/data";
import CategoryCard from "./CategoryCard";

const CategoryData = ({ categories = staticCategoriesData }) => {
  return (
    <div className="py-0 space-y-10 md:py-4 lg:py-8 ">
      {categories?.map((category) => (
        <div id={`category-${category.id}`} key={category.id} className="scroll-mt-24">
          <div className="relative">
            <img
              src={category?.image}
              alt={category?.name}
              className="w-full h-28 md:h-52 lg:h-68 xl:h-80 rounded-xl"
            />
            <div className="absolute inset-0 bg-black/30 rounded-xl" />
            <h1 className="absolute inset-0 flex items-center justify-center text-2xl font-bold tracking-wider text-white uppercase md:text-5xl lg:text-7xl">
              {category.name}
            </h1>
          </div>
          <div className="grid grid-cols-1 gap-2 my-6 sm:grid-cols-2 md:gap-3 xl:grid-cols-3 lg:gap-6">
            {category?.items?.map((item) => (
              <CategoryCard item={item} key={item.id} />
            ))}
          </div>

        </div>
      ))}

    </div>
  );
};

export default CategoryData;
