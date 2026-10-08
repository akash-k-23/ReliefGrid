import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  number: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  availability: { type: String, required: true, trim: true },
  notes: { type: String, trim: true, default: "" },
  isNational: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

emergencyContactSchema.index({ enabled: 1, category: 1, name: 1 });
export default mongoose.model("EmergencyContact", emergencyContactSchema);