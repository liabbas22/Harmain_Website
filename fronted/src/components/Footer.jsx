import React from "react";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="py-10 border-t border-gray-200 bg-gray-50">
      <div className="grid grid-cols-1 gap-8 px-4 mx-auto max-w-7xl md:px-8 lg:px-20 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Contact Us</h2>

          <div>
            <p className="font-semibold text-gray-700">Address</p>
            <p className="text-sm leading-relaxed text-gray-600">
              Harmain Sharfain Restaurant, Bahadurabad Char Minar Chowrangi{" "}
              <br />
              Opposite KFC, Near Habib Metro Bank
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-700">Email</p>
            <p className="text-sm text-gray-600">info@harmainsharfain.com.pk</p>
          </div>

          <div>
            <p className="font-semibold text-gray-700">Call Us</p>
            <p className="text-sm text-gray-600">021 38892342</p>
          </div>

          <div>
            <p className="mb-2 font-semibold text-gray-700">Follow Us</p>
            <div className="flex items-center gap-3 text-white">
              <span
                className="flex items-center justify-center p-2 bg-red-600 rounded-full cursor-pointer
               transition-all duration-500 hover:bg-red-700 hover:rotate-[360deg]
               hover:scale-110 shadow-md hover:shadow-lg"
              >
                <FaFacebookF size={14} />
              </span>

              <span
                className="flex items-center justify-center p-2 bg-red-600 rounded-full cursor-pointer
               transition-all duration-500 hover:bg-red-700 hover:rotate-[360deg]
               hover:scale-110 shadow-md hover:shadow-lg"
              >
                <FaInstagram size={14} />
              </span>

              <span
                className="flex items-center justify-center p-2 bg-red-600 rounded-full cursor-pointer
               transition-all duration-500 hover:bg-red-700 hover:rotate-[360deg]
               hover:scale-110 shadow-md hover:shadow-lg"
              >
                <FaWhatsapp size={14} />
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 md:col-span-2 lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800">
            Operational Timings
          </h2>

          <div className="grid grid-cols-1 text-sm sm:grid-cols-2 gap-y-2 gap-x-6">
            {[
              ["Monday", "06:00 AM - 03:00 AM"],
              ["Tuesday", "06:00 AM - 03:00 AM"],
              ["Wednesday", "06:00 AM - 03:00 AM"],
              ["Thursday", "06:00 AM - 03:00 AM"],
              ["Friday", "06:00 AM - 03:00 AM"],
              ["Saturday", "06:00 AM - 04:00 AM"],
              ["Sunday", "06:00 AM - 04:00 AM"],
            ].map(([day, time], i) => (
              <div
                key={i}
                className="flex items-center justify-between pb-1 border-b border-gray-200"
              >
                <span className="font-medium text-gray-700">{day}</span>
                <span className="text-gray-600">{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="pt-4 mt-10 text-xs text-center text-gray-500 border-t">
        © {new Date().getFullYear()} Harmain Sharfain. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
