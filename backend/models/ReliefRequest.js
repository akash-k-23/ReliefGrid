import mongoose from "mongoose";

const geoPointSchema = new mongoose.Schema({
  type: { type: String, enum: ["Point"] },
  coordinates: { type: [Number], default: undefined },
}, { _id: false });

const reliefRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 140 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    disasterType: { type: String, trim: true, default: "General emergency" },
    urgency: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    peopleAffected: { type: Number, min: 1, default: 1 },
    location: { type: String, required: true, trim: true, maxlength: 240 },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },
    geoLocation: { type: geoPointSchema, default: undefined },
    contactPhone: { type: String, required: true, trim: true, maxlength: 40 },
    requiredResources: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["PENDING", "REVIEWED", "IN_PROGRESS", "ASSIGNED", "RESOLVED", "CANCELLED"], default: "PENDING" },
    assignedOrganization: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDemoData: { type: Boolean, default: false }
  },
  { timestamps: true }
);

reliefRequestSchema.pre("validate", function () {
  if (Number.isFinite(this.latitude) && Number.isFinite(this.longitude)) {
    this.geoLocation = { type: "Point", coordinates: [this.longitude, this.latitude] };
  } else {
    this.geoLocation = undefined;
  }
});

reliefRequestSchema.index({ geoLocation: "2dsphere" });

export default mongoose.model("ReliefRequest", reliefRequestSchema);
