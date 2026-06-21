
import React from "react";
import { FaLocationDot, FaPhoneVolume, FaClock } from "react-icons/fa6";
import { MdDirections } from "react-icons/md";
import { motion } from "framer-motion";

const branches = [
  {
    id: 1,
    name: "Bahadurabad Branch",
    address:
      "Bahadurabad Char Minar Chowrangi, Opposite KFC, Near Habib Metro Bank, Karachi",
    phone: "021-38892342",
    timing: "12 PM - 2 AM",
    map: "https://www.google.com/maps",
  },
  {
    id: 2,
    name: "Gulshan Branch",
    address:
      "Main Rashid Minhas Road, Near Millennium Mall, Karachi",
    phone: "021-38892343",
    timing: "12 PM - 2 AM",
    map: "https://www.google.com/maps",
  },
  {
    id: 3,
    name: "North Nazimabad Branch",
    address:
      "Block H North Nazimabad, Near Five Star Chowrangi, Karachi",
    phone: "021-38892344",
    timing: "12 PM - 2 AM",
    map: "https://www.google.com/maps",
  },
];

const LocationPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <div className="px-4 mx-auto py-14 max-w-7xl md:px-8">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="inline-block px-4 py-2 text-sm font-bold tracking-widest text-red-700 uppercase bg-red-100 rounded-full">
            Our Locations
          </span>

          <h1 className="mt-5 text-4xl font-extrabold text-gray-900 md:text-6xl">
            Find Your Nearest Branch
          </h1>

          <p className="max-w-2xl mx-auto mt-4 text-gray-600 md:text-lg">
            Visit your nearest Harmain Sharfain branch and enjoy premium taste,
            fast service, and an unforgettable food experience.
          </p>
        </motion.div>

        <div className="grid gap-6 mt-14 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch, index) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="relative overflow-hidden bg-white border border-red-100 shadow-xl rounded-3xl"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-700"></div>

              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl">
                  <FaLocationDot className="text-3xl text-red-700" />
                </div>

                <h2 className="mt-5 text-2xl font-extrabold text-gray-900">
                  {branch.name}
                </h2>

                <div className="flex items-start gap-3 mt-5">
                  <FaLocationDot className="mt-1 text-red-700" />
                  <p className="leading-7 text-gray-600">{branch.address}</p>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <FaPhoneVolume className="text-red-700" />
                  <p className="font-semibold text-gray-700">
                    {branch.phone}
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <FaClock className="text-red-700" />
                  <p className="font-semibold text-gray-700">
                    {branch.timing}
                  </p>
                </div>

                <a
                  href={branch.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-4 mt-8 font-bold text-white transition-all duration-300 bg-red-700 rounded-2xl hover:bg-red-600 hover:shadow-xl"
                >
                  <MdDirections className="text-xl" />
                  Get Directions
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationPage;
