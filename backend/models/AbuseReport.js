import mongoose from "mongoose";

const abuseReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  targetType: { type: String, enum: ["REQUEST", "ALERT", "USER"], required: true },
  targetRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ReliefRequest", default: null },
  targetAlert: { type: mongoose.Schema.Types.ObjectId, ref: "EmergencyAlert", default: null },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reason: { type: String, enum: ["SPAM", "MISINFORMATION", "ABUSE", "PRIVACY", "OTHER"], required: true },
  details: { type: String, trim: true, maxlength: 1000, default: "" },
  status: { type: String, enum: ["OPEN", "REVIEWED", "DISMISSED"], default: "OPEN" },
  reviewNotes: { type: String, trim: true, maxlength: 1000, default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

abuseReportSchema.index({ reporter: 1, targetType: 1, targetRequest: 1, targetAlert: 1, targetUser: 1 }, { unique: true });
abuseReportSchema.index({ status: 1, createdAt: -1 });
export default mongoose.model("AbuseReport", abuseReportSchema);
