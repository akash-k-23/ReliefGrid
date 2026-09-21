import mongoose from "mongoose";

const volunteerOpportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    location: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    requiredVolunteers: { type: Number, min: 1, required: true },
    joinedVolunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["OPEN", "FULL", "COMPLETED", "CANCELLED"], default: "OPEN" }
  },
  { timestamps: true }
);

export default mongoose.model("VolunteerOpportunity", volunteerOpportunitySchema);
