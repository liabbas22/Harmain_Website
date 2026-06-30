import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, trim: true, lowercase: true, default: "", maxlength: 120 },
    branch: { type: String, trim: true, default: "", maxlength: 80 },
    type: {
      type: String,
      enum: ["complaint", "feedback", "suggestion"],
      default: "complaint",
    },
    subject: { type: String, trim: true, default: "", maxlength: 120 },
    orderNumber: { type: String, trim: true, default: "", maxlength: 40 },
    message: { type: String, required: true, trim: true, maxlength: 1200 },
    status: {
      type: String,
      enum: ["new", "in_review", "resolved", "closed"],
      default: "new",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },
    adminReply: { type: String, trim: true, default: "", maxlength: 1000 },
    internalNote: { type: String, trim: true, default: "", maxlength: 1000 },
    resolvedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    handledByName: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ status: 1, priority: 1, createdAt: -1 });
feedbackSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Feedback =
  mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);

export default Feedback;
