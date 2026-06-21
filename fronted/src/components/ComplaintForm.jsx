
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiMessageSquare } from "react-icons/fi";
import { FaUser, FaPhoneAlt } from "react-icons/fa";
import { MdEmail, MdRestaurantMenu } from "react-icons/md";

const ComplaintForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    branch: "",
    complaint: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

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
            Customer Support
          </span>

          <h1 className="mt-5 text-4xl font-extrabold text-gray-900 md:text-6xl">
            Complaint Form
          </h1>

          <p className="max-w-2xl mx-auto mt-4 text-gray-600 md:text-lg">
            Your feedback matters to us. Please share your issue and our team
            will contact you shortly.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl p-6 mx-auto bg-white border border-red-100 shadow-2xl mt-14 rounded-3xl md:p-10"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Full Name
                </label>

                <div className="flex items-center gap-3 px-4 border-2 border-gray-200 rounded-2xl focus-within:border-red-500">
                  <FaUser className="text-red-700" />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full py-4 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Phone Number
                </label>

                <div className="flex items-center gap-3 px-4 border-2 border-gray-200 rounded-2xl focus-within:border-red-500">
                  <FaPhoneAlt className="text-red-700" />

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full py-4 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Email Address
                </label>

                <div className="flex items-center gap-3 px-4 border-2 border-gray-200 rounded-2xl focus-within:border-red-500">
                  <MdEmail className="text-red-700" />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full py-4 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Select Branch
                </label>

                <div className="flex items-center gap-3 px-4 border-2 border-gray-200 rounded-2xl focus-within:border-red-500">
                  <MdRestaurantMenu className="text-red-700" />

                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full py-4 bg-transparent outline-none"
                  >
                    <option value="">Select Branch</option>
                    <option value="Bahadurabad">Bahadurabad</option>
                    <option value="Gulshan">Gulshan</option>
                    <option value="North Nazimabad">
                      North Nazimabad
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Complaint Details
              </label>

              <div className="flex gap-3 px-4 border-2 border-gray-200 rounded-2xl focus-within:border-red-500">
                <FiMessageSquare className="mt-5 text-xl text-red-700" />

                <textarea
                  name="complaint"
                  value={formData.complaint}
                  onChange={handleChange}
                  placeholder="Write your complaint here..."
                  className="w-full h-40 py-4 bg-transparent outline-none resize-none"
                ></textarea>
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center w-full gap-3 px-6 py-4 text-lg font-bold text-white transition-all duration-300 bg-red-700 shadow-xl rounded-2xl hover:bg-red-600 hover:scale-[1.01]"
            >
              Submit Complaint
              <span className="transition-all duration-200 group-hover:translate-x-1">
                →
              </span>
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ComplaintForm;

