import mongoose from "mongoose";

const addOnSnapshotSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
}, { _id: false });

const comboItemSnapshotSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  name: { type: String, required: true, trim: true },
  optionName: { type: String, default: "", trim: true },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  optionName: { type: String, default: "" },
  specialInstructions: { type: String, default: "", trim: true, maxlength: 500 },
  addOns: { type: [addOnSnapshotSchema], default: [] },
  addOnsKey: { type: String, default: "" },
  comboItems: { type: [comboItemSnapshotSchema], default: [] },
  image: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  freeQuantity: { type: Number, default: 0, min: 0 },
  grossQuantity: { type: Number, default: 0, min: 0 },
}, { _id: false });

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  line1: { type: String, required: true, trim: true },
  line2: { type: String, default: "", trim: true },
  city: { type: String, required: true, trim: true },
  area: { type: String, default: "", trim: true },
  instructions: { type: String, default: "", trim: true },
}, { _id: false });

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ["percentage", "fixed"], required: true },
  value: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, min: 0 },
}, { _id: false });

const offerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  dealType: { type: String, enum: ["discount", "buy_x_get_y", "combo"], default: "discount" },
  discountType: { type: String, enum: ["percentage", "fixed"], required: true },
  value: { type: Number, required: true, min: 0 },
  appliesTo: { type: String, enum: ["order", "category", "products"], required: true },
  buyQuantity: { type: Number, default: 1, min: 1 },
  getQuantity: { type: Number, default: 1, min: 1 },
  comboPrice: { type: Number, default: 0, min: 0 },
  discount: { type: Number, required: true, min: 0 },
}, { _id: false });

const offerBreakdownSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  productName: { type: String, required: true, trim: true },
  optionName: { type: String, default: "", trim: true },
  quantity: { type: Number, required: true, min: 1 },
  freeQuantity: { type: Number, default: 0, min: 0 },
  grossQuantity: { type: Number, default: 0, min: 0 },
  lineSubtotal: { type: Number, default: 0, min: 0 },
  freeItemValue: { type: Number, default: 0, min: 0 },
  offerName: { type: String, required: true, trim: true },
  dealType: { type: String, enum: ["discount", "buy_x_get_y", "combo"], default: "discount" },
  discountType: { type: String, enum: ["percentage", "fixed"], required: true },
  value: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, min: 0 },
}, { _id: false });

const loyaltyDiscountSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  discountType: { type: String, enum: ["percentage", "fixed"], required: true },
  value: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, min: 0 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: { type: [itemSchema], required: true },
  deliveryAddress: { type: addressSchema, required: true },
  assignedRider: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  assignedAt: { type: Date, default: null },
  paymentMethod: { type: String, enum: ["cash_on_delivery", "card"], default: "cash_on_delivery" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  orderStatus: { type: String, enum: ["placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"], default: "placed" },
  cancellationReason: { type: String, enum: ["customer_request", "duplicate_order", "unavailable_items", "delivery_issue", "payment_issue", "other"], default: null },
  cancellationNote: { type: String, default: "", trim: true, maxlength: 500 },
  cancelledAt: { type: Date, default: null },
  refundStatus: { type: String, enum: ["not_required", "pending", "processing", "completed", "failed"], default: "not_required" },
  refundAmount: { type: Number, default: 0, min: 0 },
  refundReference: { type: String, default: "", trim: true, maxlength: 120 },
  refundedAt: { type: Date, default: null },
  subtotal: { type: Number, required: true, min: 0 },
  coupon: { type: couponSchema, default: null },
  offer: { type: offerSchema, default: null },
  loyaltyDiscount: { type: loyaltyDiscountSchema, default: null },
  offerBreakdown: { type: [offerBreakdownSchema], default: [] },
  discount: { type: Number, default: 0, min: 0 },
  deliveryFee: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ assignedRider: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, refundStatus: 1, createdAt: -1 });
orderSchema.index({ user: 1, "coupon.code": 1 });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
