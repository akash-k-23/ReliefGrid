import mongoose from "mongoose";

const volunteerApplicationAuditSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: "VolunteerApplication", required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  previousStatus: { type: String, required: true },
  newStatus: { type: String, required: true },
  previousHours: { type: Number, min: 0, default: 0 },
  newHours: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

volunteerApplicationAuditSchema.index({ application: 1, createdAt: -1 });
export default mongoose.model("VolunteerApplicationAudit", volunteerApplicationAuditSchema);