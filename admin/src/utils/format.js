export const money = (value) =>
  `Rs. ${new Intl.NumberFormat("en-PK").format(Number(value || 0))}`;

export const titleCase = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());

export const shortId = (value = "") => `#${value.slice(-6).toUpperCase()}`;

export const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

export const productCategoryId = (product) => product.category?._id || product.category;
