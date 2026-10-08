import mongoose from "mongoose";

const emergencyResponseSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: "ReliefRequest", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  response: { type: String, enum: ["ACCEPTED", "DECLINED", "DONATION_PLEDGED", "VOLUNTEER_PLEDGED"], required: true },
  donation: { type: mongoose.Schema.Types.ObjectId, ref: "Donation", default: null },
  volunteerApplication: { type: mongoose.Schema.Types.ObjectId, ref: "VolunteerApplication", default: null },
}, { timestamps: true });

emergencyResponseSchema.index({ request: 1, recipient: 1 }, { unique: true });
emergencyResponseSchema.index({ request: 1, createdAt: -1 });
export default mongoose.model("EmergencyResponse", emergencyResponseSchema);