import mongoose from "mongoose";

const orderNotificationSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

orderNotificationSchema.index({ admin: 1, order: 1 }, { unique: true });
orderNotificationSchema.index({ admin: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.OrderNotification ||
  mongoose.model("OrderNotification", orderNotificationSchema);
