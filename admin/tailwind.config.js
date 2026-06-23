/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f1",
          600: "#b91c1c",
          700: "#991b1b",
        },
      },
    },
  },
  plugins: [],
}
