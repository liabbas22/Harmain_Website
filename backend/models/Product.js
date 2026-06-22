import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    image: {
      type: String,
      default: "",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    options: {
      type: [{
        name: { type: String, required: true, trim: true },
        actualPrice: { type: Number, required: true, min: 0 },
        discountPrice: { type: Number, min: 0 },
        tag: { type: String, default: "", trim: true },
      }],
      default: [],
    },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", tags: "text" });

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
