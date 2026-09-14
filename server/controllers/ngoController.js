import ReliefRequest from "../models/ReliefRequest.js";
import VolunteerOpportunity from "../models/VolunteerOpportunity.js";
import Donation from "../models/Donation.js";
import VolunteerApplication from "../models/VolunteerApplication.js";

export const ngoDashboard = async (req, res) => {
  const [requests, opportunities, commitments, applications] = await Promise.all([
    ReliefRequest.find({ status: { $nin: ["RESOLVED", "CANCELLED"] } }).sort({ createdAt: -1 }).limit(100),
    VolunteerOpportunity.find({ organization: req.user._id }).sort({ date: 1 }),
    Donation.find().populate("request", "title status").sort({ createdAt: -1 }).limit(100),
    VolunteerApplication.find().populate("volunteer", "name email").populate({ path: "opportunity", match: { organization: req.user._id }, select: "title organization" })
  ]);
  res.json({ success: true, data: { requests, opportunities, commitments, applications: applications.filter((item) => item.opportunity) } });
};
