import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  badgeId: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now },
  qualifyingDonationCount: { type: Number, min: 0, default: 0 },
  qualifyingVolunteerCount: { type: Number, min: 0, default: 0 },
  qualifyingRecords: [{ kind: { type: String, enum: ["DONATION", "VOLUNTEER"] }, recordId: { type: mongoose.Schema.Types.ObjectId } }],
  verificationStatus: { type: String, enum: ["VERIFIED"], default: "VERIFIED" },
}, { timestamps: true });

achievementSchema.index({ user: 1, badgeId: 1 }, { unique: true });
export default mongoose.model("Achievement", achievementSchema);