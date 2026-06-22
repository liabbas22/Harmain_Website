import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChevronLeft,
  FaChevronRight,
  FaMinus,
  FaPlus,
  FaTrash,
} from "react-icons/fa6";
import api from "../api";

const MINIMUM_ORDER = 500;

export default function CartDrawer({ onClose }) {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState([]);
  const [offset, setOffset] = useState(0);
  const load = async () => {
    const { data } = await api.get("/cart");
    setCart(data);
  };
  useEffect(() => {
    load().catch(() => {});
    api
      .get("/products")
      .then(({ data }) => setProducts(data.products || data || []))
      .catch(() => {});
    const refresh = () => load().catch(() => {});
    window.addEventListener("harmain-cart-updated", refresh);
    return () => window.removeEventListener("harmain-cart-updated", refresh);
  }, []);
  const change = async (id, quantity, optionName = "") => {
    if (quantity < 1) return remove(id, optionName);
    await api.patch(`/cart/${id}`, { quantity, optionName });
    await load();
    window.dispatchEvent(new Event("harmain-cart-updated"));
  };
  const remove = async (id, optionName = "") => {
    await api.delete(`/cart/${id}`, { params: { optionName } });
    await load();
    window.dispatchEvent(new Event("harmain-cart-updated"));
  };
  const add = async (id) => {
    await api.post("/cart", { productId: id, quantity: 1 });
    await load();
    window.dispatchEvent(new Event("harmain-cart-updated"));
  };
  const items = cart?.items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? item.product?.price ?? 0) * item.quantity,
    0,
  );
  const discount = 0;
  const canCheckout = subtotal >= MINIMUM_ORDER;
  const recommendations = products.filter(
    (product) => !items.some((item) => item.product?._id === product._id),
  );
  const visible = recommendations.slice(offset, offset + 2);
  return (
    <div className="flex h-[calc(100%-64px)] flex-col bg-[#fffdfc]">
      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-700">
              Your order
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-gray-900">
              Cart items{" "}
              <span className="text-sm font-semibold text-gray-400">
                ({items.reduce((sum, item) => sum + item.quantity, 0)})
              </span>
            </h2>
          </div>
        </div>
        {!cart ? (
          <div className="flex justify-center py-12" aria-label="Loading cart">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-red-100 border-t-red-700" />
          </div>
        ) : !items.length ? (
          <div className="p-8 text-center bg-white border border-red-200 border-dashed rounded-2xl">
            <p className="font-bold text-gray-800">Your cart is empty</p>
            <p className="mt-1 text-sm text-gray-500">
              Add something delicious from the menu.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(
              ({ product, quantity, unitPrice, optionName }) =>
                product && (
                  <article
                    key={`${product._id}-${optionName || "regular"}`}
                    className="flex gap-3 p-3 bg-white border border-red-100 shadow-sm rounded-2xl"
                  >
                    <div className="w-16 h-16 overflow-hidden shrink-0 rounded-xl bg-red-50">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="object-cover w-full h-full"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-extrabold text-gray-900 truncate">
                            {product.name}
                          </h3>
                          {optionName && (
                            <p className="mt-0.5 text-xs font-medium text-gray-500">
                              {optionName}
                            </p>
                          )}
                          <p className="mt-1 text-sm font-bold text-red-700">
                            Rs. {unitPrice ?? product.price}
                          </p>
                        </div>
                        <button
                          onClick={() => remove(product._id, optionName)}
                          className="flex items-center justify-center w-8 h-8 text-center text-red-600 transition rounded-full hover:bg-red-50"
                        >
                          <FaTrash size={13} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-red-100 rounded-lg bg-red-50">
                          <button
                            onClick={() => change(product._id, quantity - 1, optionName)}
                            className="p-2 text-red-700"
                          >
                            <FaMinus size={10} />
                          </button>
                          <b className="text-sm text-center w-7">{quantity}</b>
                          <button
                            onClick={() => change(product._id, quantity + 1, optionName)}
                            className="p-2 text-red-700"
                          >
                            <FaPlus size={10} />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-gray-800">
                          Rs. {(unitPrice ?? product.price) * quantity}
                        </p>
                      </div>
                    </div>
                  </article>
                ),
            )}
          </div>
        )}
        <section className="pt-5 border-t border-red-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-extrabold text-gray-900">
                Popular with your order
              </p>
              <p className="text-xs text-gray-500">
                Add a little more to your meal
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setOffset(Math.max(0, offset - 2))}
                className="p-2 text-white transition-all duration-300 ease-in-out bg-red-600 border border-red-100 rounded-full hover:bg-red-700"
              >
                <FaChevronLeft size={10} />
              </button>
              <button
                onClick={() =>
                  setOffset(
                    Math.min(
                      Math.max(0, recommendations.length - 2),
                      offset + 2,
                    ),
                  )
                }
                className="p-2 text-white transition-all duration-300 ease-in-out bg-red-600 border border-red-100 rounded-full hover:bg-red-700"
              >
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {visible.map((product) => (
              <button
                key={product._id}
                onClick={() => add(product._id)}
                className="p-3 text-left transition bg-white border border-red-100 rounded-xl hover:border-red-300 hover:bg-red-50"
              >
                <p className="text-xs font-bold text-gray-800 line-clamp-1">
                  {product.name}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-bold text-red-700">
                    Rs. {product.price}
                  </span>
                  <span className="rounded-md bg-red-700 px-2 py-1 text-[10px] font-bold text-white">
                    Add
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
      <footer className="border-t border-red-100 bg-white p-4 shadow-[0_-8px_24px_rgba(120,30,20,0.06)]">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Total</span>
            <b className="text-gray-900">Rs. {subtotal}</b>
          </div>
          <div className="flex justify-between text-red-700">
            <span>Discount</span>
            <b>- Rs. {discount}</b>
          </div>
          <div className="flex justify-between pt-3 mt-3 text-base font-extrabold text-gray-900 border-t border-red-100">
            <span>Grand Total</span>
            <span>Rs. {subtotal - discount}</span>
          </div>
          {discount > 0 && (
            <p className="text-xs font-bold text-green-700">
              Yay! You saved Rs. {discount}
            </p>
          )}
        </div>
        <button
          disabled={!canCheckout}
          title={!canCheckout ? `Minimum order is Rs. ${MINIMUM_ORDER}` : "Checkout"}
          onClick={() => {
            onClose?.();
            navigate("/checkout");
          }}
          className="w-full py-3 mt-4 text-sm font-extrabold text-white transition bg-red-700 shadow-lg rounded-xl shadow-red-700/20 hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Checkout
        </button>
      </footer>
    </div>
  );
}
