import mongoose from "mongoose";

const geoPointSchema = new mongoose.Schema({
  type: { type: String, enum: ["Point"] },
  coordinates: { type: [Number], default: undefined },
}, { _id: false });

const volunteerOpportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    location: { type: String, required: true, trim: true },
    geoLocation: { type: geoPointSchema, default: undefined },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    requiredVolunteers: { type: Number, min: 1, required: true },
    joinedVolunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sourceRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ReliefRequest", default: null },
    sourceDonation: { type: mongoose.Schema.Types.ObjectId, ref: "Donation", default: null },
    isDemoData: { type: Boolean, default: false },
    status: { type: String, enum: ["OPEN", "FULL", "COMPLETED", "CANCELLED"], default: "OPEN" }
  },
  { timestamps: true }
);

volunteerOpportunitySchema.index({ geoLocation: "2dsphere" });

export default mongoose.model("VolunteerOpportunity", volunteerOpportunitySchema);
