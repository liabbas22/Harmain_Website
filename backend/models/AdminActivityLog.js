import mongoose from "mongoose";

export const ADMIN_ACTIVITY_RETENTION_DAYS = 90;
const ADMIN_ACTIVITY_RETENTION_SECONDS =
  ADMIN_ACTIVITY_RETENTION_DAYS * 24 * 60 * 60;

const adminActivityLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    adminName: {
      type: String,
      trim: true,
      default: "",
    },

    adminEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    entity: {
      type: String,
      trim: true,
      default: "system",
      index: true,
    },

    entityId: {
      type: String,
      trim: true,
      default: "",
    },

    method: {
      type: String,
      trim: true,
      default: "",
    },

    path: {
      type: String,
      trim: true,
      default: "",
    },

    ipAddress: {
      type: String,
      trim: true,
      default: "",
    },

    userAgent: {
      type: String,
      trim: true,
      default: "",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

adminActivityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: ADMIN_ACTIVITY_RETENTION_SECONDS },
);
adminActivityLogSchema.index({ admin: 1, createdAt: -1 });

const AdminActivityLog =
  mongoose.models.AdminActivityLog ||
  mongoose.model("AdminActivityLog", adminActivityLogSchema);

export default AdminActivityLog;
