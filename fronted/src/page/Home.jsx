import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaCoffee, FaExclamationTriangle, FaFish, FaHamburger, FaIceCream, FaPizzaSlice, FaUtensils } from "react-icons/fa";
import { GiChickenOven, GiNoodles } from "react-icons/gi";
import { MdLocalDrink } from "react-icons/md";
import Herosection from "../components/Herosection";
import Category from "../components/Category";
import Search from "../components/Search";
import PopularItem from "../components/PopularItem";
import CategoryData from "../components/CategoryData";
import { AssetsData } from "../assets/assets";
import api, { apiError } from "../api";

const iconFor = (name = "") => { const value = name.toLowerCase(); if (value.includes("pizza")) return FaPizzaSlice; if (value.includes("burger")) return FaHamburger; if (value.includes("drink")) return MdLocalDrink; if (value.includes("ice")) return FaIceCream; if (value.includes("fish") || value.includes("sea")) return FaFish; if (value.includes("coffee")) return FaCoffee; if (value.includes("noodle") || value.includes("chinese")) return GiNoodles; return GiChickenOven; };
const productCard = (product) => ({ id: product._id, categoryId: product.category?._id || product.category, title: product.name, description: product.description, image: product.image || AssetsData.ChickenCheeseOmellete, options: product.options?.length ? product.options : [{ name: "Regular", actualPrice: product.price }] });
const Skeleton = () => <div className="space-y-6 animate-pulse"><div className="h-20 rounded-2xl bg-red-100"/><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 rounded-2xl bg-white"/>)}</div><div className="h-56 rounded-2xl bg-white"/></div>;
const State = ({ error, retry }) => <div className="rounded-2xl border border-dashed border-red-200 bg-white px-6 py-14 text-center shadow-sm"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-700">{error ? <FaExclamationTriangle /> : <FaUtensils />}</div><h2 className="mt-4 text-xl font-extrabold text-gray-900">{error ? "Could not load the menu" : "Menu coming soon"}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">{error || "No food items are available right now. Please check again shortly."}</p>{retry && <button onClick={retry} className="mt-5 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800">Try again</button>}</div>;

const Home = () => {
  const [categories, setCategories] = useState([]); const [products, setProducts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const loadMenu = useCallback(async () => { setLoading(true); setError(""); try { const [categoryResponse, productResponse] = await Promise.all([api.get("/categories"), api.get("/products")]); setCategories(categoryResponse.data); setProducts(productResponse.data.products || productResponse.data || []); } catch (requestError) { setError(apiError(requestError)); } finally { setLoading(false); } }, []);
  useEffect(() => { loadMenu(); }, [loadMenu]);
  const categoryUi = useMemo(() => categories.map((category) => ({ id: category._id, title: category.name, icon: iconFor(category.name), name: category.name, image: category.image || AssetsData.CategoryImage, items: products.filter((product) => (product.category?._id || product.category) === category._id).map(productCard) })), [categories, products]);
  const menuItems = useMemo(() => products.map(productCard), [products]);
  const popular = useMemo(() => menuItems.slice(0, 4), [menuItems]);
  return <div className="bg-red-50"><Herosection />{loading ? <div className="mx-4 py-8 md:mx-8 lg:mx-24"><Skeleton /></div> : error ? <div className="mx-4 py-8 md:mx-8 lg:mx-24"><State error={error} retry={loadMenu} /></div> : !categoryUi.length ? <div className="mx-4 py-8 md:mx-8 lg:mx-24"><State /></div> : <><Category categories={categoryUi} /><div className="flex flex-col gap-4 py-2 mx-4 my-auto md:mx-8 lg:mx-24"><Search items={menuItems} /><PopularItem items={popular} /><CategoryData categories={categoryUi} /></div></>}</div>;
};
export default Home;
