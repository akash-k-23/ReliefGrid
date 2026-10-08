import mongoose from "mongoose";

const emergencyContactAuditSchema = new mongoose.Schema({
  contact: { type: mongoose.Schema.Types.ObjectId, ref: "EmergencyContact", default: null },
  key: { type: String, required: true },
  action: { type: String, enum: ["CREATED", "UPDATED", "DISABLED", "DELETED"], required: true },
  before: { type: mongoose.Schema.Types.Mixed, default: null },
  after: { type: mongoose.Schema.Types.Mixed, default: null },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

emergencyContactAuditSchema.index({ createdAt: -1 });
export default mongoose.model("EmergencyContactAudit", emergencyContactAuditSchema);
