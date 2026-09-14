import mongoose from "mongoose";

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

const User = mongoose.model("User", userSchema);

export default User;
