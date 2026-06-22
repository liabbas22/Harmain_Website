import React, { useEffect, useMemo, useState } from "react";
import { FaCoffee, FaFish, FaHamburger, FaIceCream, FaPizzaSlice } from "react-icons/fa";
import { GiChickenOven, GiNoodles } from "react-icons/gi";
import { MdLocalDrink } from "react-icons/md";
import Herosection from "../components/Herosection";
import Category from "../components/Category";
import Search from "../components/Search";
import PopularItem from "../components/PopularItem";
import CategoryData from "../components/CategoryData";
import { AssetsData } from "../assets/assets";
import api from "../api";

const iconFor = (name = "") => { const value = name.toLowerCase(); if (value.includes("pizza")) return FaPizzaSlice; if (value.includes("burger")) return FaHamburger; if (value.includes("drink")) return MdLocalDrink; if (value.includes("ice")) return FaIceCream; if (value.includes("fish") || value.includes("sea")) return FaFish; if (value.includes("coffee")) return FaCoffee; if (value.includes("noodle") || value.includes("chinese")) return GiNoodles; return GiChickenOven; };
const productCard = (product) => ({ id: product._id, title: product.name, description: product.description, image: product.image || AssetsData.ChickenCheeseOmellete, options: [{ name: "Regular", actualPrice: product.price }] });

const Home = () => {
  const [categories, setCategories] = useState([]); const [products, setProducts] = useState([]);
  useEffect(() => { Promise.all([api.get("/categories"), api.get("/products")]).then(([categoryResponse, productResponse]) => { setCategories(categoryResponse.data); setProducts(productResponse.data.products || productResponse.data || []); }).catch(() => {}); }, []);
  const categoryUi = useMemo(() => categories.map((category) => ({ id: category._id, title: category.name, icon: iconFor(category.name), name: category.name, image: category.image || AssetsData.CategoryImage, items: products.filter((product) => (product.category?._id || product.category) === category._id).map(productCard) })), [categories, products]);
  const popular = useMemo(() => products.slice(0, 4).map(productCard), [products]);
  return <div className="bg-red-50"><Herosection /><Category categories={categoryUi} /><div className="flex flex-col gap-4 py-2 mx-4 my-auto md:mx-8 lg:mx-24"><Search /><PopularItem items={popular} /><CategoryData categories={categoryUi} /></div></div>;
};
export default Home;
