import React, { useEffect, useMemo, useState } from "react";
import { IoMdArrowRoundForward } from "react-icons/io";
import { foodItems, suggestions } from "../Data/data";
const Search = ({ items = foodItems }) => {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) return;

    const currentText = suggestions[index] || "";

    const typing = setTimeout(() => {
      setPlaceholder(currentText.slice(0, charIndex + 1));
      setCharIndex((prev) => prev + 1);
    }, 80);

    if (charIndex === currentText?.length) {
      setTimeout(() => {
        setCharIndex(0);
        setIndex((prev) => (prev + 1) % suggestions.length);
      }, 1500);
    }

    return () => clearTimeout(typing);
  }, [charIndex, index, isFocused]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return items.filter((item) => [item.title, item.name, item.description, ...(item.tags || [])].filter(Boolean).join(" ").toLowerCase().includes(term)).slice(0, 8);
  }, [items, query]);

  const handleSearch = (value) => setQuery(value);

  const selectResult = (item) => {
    setQuery(item.title || item.name || "");
    setIsFocused(false);
    const productTarget = document.getElementById(`product-${item.id}`);
    if (productTarget) {
      productTarget.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const categoryId = item.categoryId || item.category?._id || item.category;
    if (categoryId) document.getElementById(`category-${categoryId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <section id="search-section" className="relative w-full mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results[0]) {
              event.preventDefault();
              selectResult(results[0]);
            }
          }}
          placeholder={
            isFocused ? "Search food..." : `Search for ${placeholder}...`
          }
          className="w-full py-3 pl-5 pr-12 text-sm font-medium text-gray-700 placeholder-red-500 transition-all duration-300 border-2 border-red-600 rounded-full outline-none md:text-base"
        />
        <button
          className="absolute flex items-center justify-center text-white transition -translate-y-1/2 bg-red-600 rounded-full top-1/2 right-2 w-9 h-9 hover:bg-red-700 active:scale-95"
          onClick={() => {
            if (results[0]) selectResult(results[0]);
          }}
          aria-label="Go to first search result"
        >
          <IoMdArrowRoundForward size={18} />
        </button>
      </div>

      {isFocused && results?.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden bg-white shadow-lg rounded-xl">
          {results?.map((item) => (
            <div
              key={item.id}
              className="px-4 py-2 text-sm cursor-pointer hover:bg-red-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectResult(item)}
            >
              {item.title || item.name}
            </div>
          ))}
        </div>
      )}
      {isFocused && query && results?.length === 0 && (
        <div className="absolute left-0 right-0 z-50 px-4 py-2 mt-2 text-sm text-gray-500 bg-white shadow rounded-xl">
          No results found
        </div>
      )}
    </section>
  );
};

export default Search;
