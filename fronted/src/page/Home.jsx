import React from "react";
import Herosection from "../components/Herosection";
import Category from "../components/Category";
import Search from "../components/Search";
import PopularItem from "../components/PopularItem";
import CategoryData from "../components/CategoryData";

const Home = () => {
  return (
    <div className="bg-red-50">
      <Herosection />
      <Category />
      <div className="flex flex-col gap-4 py-2 mx-4 my-auto md:mx-8 lg:mx-24">
        <Search />
        <PopularItem />
        <CategoryData />
      </div>
    </div>
  );
};

export default Home;
