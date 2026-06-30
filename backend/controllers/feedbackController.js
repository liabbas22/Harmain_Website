import Feedback from "../models/Feedback.js";
import asyncHandler from "../utils/asyncHandler.js";

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");
const allowedTypes = ["complaint", "feedback", "suggestion"];
const allowedStatuses = ["new", "in_review", "resolved", "closed"];
const allowedPriorities = ["low", "normal", "high", "urgent"];

const feedbackResponse = (feedback) => ({
  _id: feedback._id,
  name: feedback.name,
  phone: feedback.phone,
  email: feedback.email || "",
  branch: feedback.branch || "",
  type: feedback.type,
  subject: feedback.subject || "",
  orderNumber: feedback.orderNumber || "",
  message: feedback.message,
  status: feedback.status,
  priority: feedback.priority,
  adminReply: feedback.adminReply || "",
  internalNote: feedback.internalNote || "",
  handledByName: feedback.handledByName || "",
  resolvedAt: feedback.resolvedAt,
  createdAt: feedback.createdAt,
  updatedAt: feedback.updatedAt,
});

export const createFeedback = asyncHandler(async (req, res) => {
  const name = cleanString(req.body.name);
  const phone = cleanString(req.body.phone);
  const email = cleanString(req.body.email).toLowerCase();
  const message = cleanString(req.body.message || req.body.complaint);

  if (name.length < 2)
    return res.status(400).json({ message: "Full name is required" });
  if (!/^\+?\d[\d\s-]{8,}$/.test(phone))
    return res.status(400).json({ message: "Enter a valid phone number" });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: "Enter a valid email address" });
  if (message.length < 10)
    return res.status(400).json({ message: "Please write complete details" });

  const type = allowedTypes.includes(req.body.type) ? req.body.type : "complaint";
  const feedback = await Feedback.create({
    name,
    phone,
    email,
    branch: cleanString(req.body.branch),
    type,
    subject: cleanString(req.body.subject).slice(0, 120),
    orderNumber: cleanString(req.body.orderNumber).slice(0, 40),
    message,
  });

  res.status(201).json({
    message: "Thank you. Your message has been submitted.",
    feedback: feedbackResponse(feedback),
  });
});

export const getFeedbackForAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
  const filter = {};
  if (allowedStatuses.includes(req.query.status)) filter.status = req.query.status;
  if (allowedPriorities.includes(req.query.priority)) filter.priority = req.query.priority;
  if (allowedTypes.includes(req.query.type)) filter.type = req.query.type;
  if (req.query.search) {
    const search = cleanString(req.query.search);
    filter.$or = [
      { name: new RegExp(search, "i") },
      { phone: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { message: new RegExp(search, "i") },
      { orderNumber: new RegExp(search, "i") },
    ];
  }

  const [items, total] = await Promise.all([
    Feedback.find(filter)
      .sort({ status: 1, priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Feedback.countDocuments(filter),
  ]);

  res.json({
    feedback: items.map(feedbackResponse),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

export const updateFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return res.status(404).json({ message: "Feedback not found" });

  if (allowedStatuses.includes(req.body.status)) {
    feedback.status = req.body.status;
    feedback.resolvedAt = ["resolved", "closed"].includes(req.body.status)
      ? new Date()
      : null;
  }
  if (allowedPriorities.includes(req.body.priority))
    feedback.priority = req.body.priority;
  if (req.body.adminReply !== undefined)
    feedback.adminReply = cleanString(req.body.adminReply).slice(0, 1000);
  if (req.body.internalNote !== undefined)
    feedback.internalNote = cleanString(req.body.internalNote).slice(0, 1000);
  feedback.handledBy = req.user._id;
  feedback.handledByName = req.user.name || "Admin";

  await feedback.save();
  res.json(feedbackResponse(feedback));
});
