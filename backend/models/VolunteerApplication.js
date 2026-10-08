import mongoose from "mongoose";

const volunteerApplicationSchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  opportunity: { type: mongoose.Schema.Types.ObjectId, ref: "VolunteerOpportunity", required: true },
  skills: { type: [String], default: [] },
  availability: { type: String, trim: true, maxlength: 240, default: "" },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"], default: "PENDING" },
  verifiedHours: { type: Number, min: 0, max: 24, default: 0 },
  hoursVerifiedAt: { type: Date, default: null },
  hoursVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });

volunteerApplicationSchema.index({ volunteer: 1, opportunity: 1 }, { unique: true });
export default mongoose.model("VolunteerApplication", volunteerApplicationSchema);
