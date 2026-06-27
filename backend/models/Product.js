import mongoose from "mongoose";

const addOnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true },
);

const comboItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    label: {
      type: String,
      default: "",
      trim: true,
    },
    optionName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true },
);

const availabilityScheduleSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    days: {
      type: [Number],
      default: [],
      validate: {
        validator: (days) =>
          days.every(
            (day) => Number.isInteger(day) && day >= 0 && day <= 6,
          ),
        message: "Availability days are invalid",
      },
    },
    startTime: {
      type: String,
      default: "",
      trim: true,
      match: [/^$|^([01]\d|2[0-3]):[0-5]\d$/, "Start time is invalid"],
    },
    endTime: {
      type: String,
      default: "",
      trim: true,
      match: [/^$|^([01]\d|2[0-3]):[0-5]\d$/, "End time is invalid"],
    },
    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 140,
    },
  },
  { _id: false },
);

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
    addOns: {
      type: [addOnSchema],
      default: [],
    },
    availabilitySchedule: {
      type: availabilityScheduleSchema,
      default: () => ({}),
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isComboMeal: {
      type: Boolean,
      default: false,
    },
    comboItems: {
      type: [comboItemSchema],
      default: [],
    },
    displayOrder: {
      type: Number,
      default: 0,
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
productSchema.index({ isFeatured: -1, isPopular: -1, displayOrder: 1 });

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
