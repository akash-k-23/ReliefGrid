import mongoose from "mongoose";

const achievementAuditSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  badgeId: { type: String, required: true },
  action: { type: String, enum: ["UNLOCKED", "RECALCULATED"], required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  donationCount: { type: Number, min: 0, default: 0 },
  volunteerCount: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

achievementAuditSchema.index({ user: 1, createdAt: -1 });
export default mongoose.model("AchievementAudit", achievementAuditSchema);