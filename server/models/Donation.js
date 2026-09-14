import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    request: { type: mongoose.Schema.Types.ObjectId, ref: "ReliefRequest", default: null },
    donationType: { type: String, enum: ["MONEY", "FOOD", "CLOTHING", "MEDICAL", "OTHER"], required: true },
    item: { type: String, required: true, trim: true },
    quantity: { type: String, required: true, trim: true },
    amount: { type: Number, min: 0, default: 0 },
    message: { type: String, trim: true, maxlength: 1000, default: "" },
    location: { type: String, required: true, trim: true },
    status: { type: String, enum: ["PLEDGED", "RECEIVED", "ALLOCATED", "CANCELLED"], default: "PLEDGED" }
  },
  { timestamps: true }
);

export default mongoose.model("Donation", donationSchema);
