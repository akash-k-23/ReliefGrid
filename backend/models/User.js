import mongoose from "mongoose";

const quietHoursSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  start: { type: String, default: "22:00", match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  end: { type: String, default: "07:00", match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  timezone: { type: String, default: "Asia/Kolkata" },
}, { _id: false });
const geoPointSchema = new mongoose.Schema({
  type: { type: String, enum: ["Point"] },
  coordinates: { type: [Number], default: undefined },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["INDIVIDUAL", "VOLUNTEER", "NGO", "ADMIN"],
      required: true
    },

    name: {
      type: String,
      required: function () {
        return ["INDIVIDUAL", "VOLUNTEER"].includes(this.role);
      },
      trim: true
    },

    organizationName: {
      type: String,
      required: function () {
        return this.role === "NGO";
      },
      trim: true
    },

    organizationType: {
      type: String,
      trim: true
    },

    registrationNumber: {
      type: String,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    emergencySmsOptIn: { type: Boolean, default: false },
    phoneVerifiedAt: { type: Date, default: null },
    emergencyAlertLocation: { type: geoPointSchema, default: undefined },
    emergencyAlertRadiusKm: { type: Number, min: 1, max: 100, default: 10 },
    emergencyAlertTypes: { type: [String], default: ["ALL"] },
    emergencyQuietHours: { type: quietHoursSchema, default: () => ({}) },
    phoneVerificationCodeHash: { type: String, select: false, default: null },
    phoneVerificationExpiresAt: { type: Date, select: false, default: null },
    phoneVerificationSentAt: { type: Date, select: false, default: null },
    phoneVerificationCount: { type: Number, select: false, default: 0 },
    phoneVerificationWindowAt: { type: Date, select: false, default: null },

    proofDocument: {
      type: String,
      default: null
    },

    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"],
      default: "PENDING"
    },

    passwordResetToken: {
      type: String,
      default: null
    },

    passwordResetExpires: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ emergencyAlertLocation: "2dsphere" });

const User = mongoose.model("User", userSchema);

export default User;
