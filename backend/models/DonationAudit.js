import mongoose from "mongoose";

const donationAuditSchema = new mongoose.Schema({
  donation: { type: mongoose.Schema.Types.ObjectId, ref: "Donation", required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  previousStatus: { type: String, required: true },
  newStatus: { type: String, required: true },
}, { timestamps: true });

donationAuditSchema.index({ donation: 1, createdAt: -1 });
export default mongoose.model("DonationAudit", donationAuditSchema);