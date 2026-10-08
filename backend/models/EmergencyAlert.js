import mongoose from "mongoose";

const emergencyAlertSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: "ReliefRequest", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  provider: { type: String, enum: ["mock", "twilio", "gateway"], required: true },
  providerMessageId: { type: String, default: null },
  status: { type: String, enum: ["QUEUED", "SENDING", "RETRY", "SENT", "DELIVERED", "FAILED", "MOCKED", "CANCELLED"], default: "QUEUED" },
  attempts: { type: Number, min: 0, default: 0 },
  nextAttemptAt: { type: Date, default: Date.now },
  lastError: { type: String, maxlength: 500, default: "" },
  idempotencyKey: { type: String, required: true, unique: true },
  sentAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
}, { timestamps: true });

emergencyAlertSchema.index({ recipient: 1, createdAt: -1 });
emergencyAlertSchema.index({ request: 1, status: 1 });
emergencyAlertSchema.index({ status: 1, nextAttemptAt: 1 });
emergencyAlertSchema.index({ provider: 1, providerMessageId: 1 }, { sparse: true });
emergencyAlertSchema.index({ request: 1, recipient: 1 }, { unique: true });
export default mongoose.model("EmergencyAlert", emergencyAlertSchema);