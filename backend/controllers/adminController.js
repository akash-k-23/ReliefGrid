import User from "../models/User.js";
import ReliefRequest from "../models/ReliefRequest.js";
import VolunteerApplication from "../models/VolunteerApplication.js";
import Donation from "../models/Donation.js";

export const listUsers = async (req, res) => {
  const users = await User.find().select("-password -passwordResetToken -passwordResetExpires").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: users });
};

export const updateUserStatus = async (req, res) => {
  const allowed = ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"];
  if (!allowed.includes(req.body.verificationStatus)) return res.status(400).json({ success: false, message: "Invalid verification status" });
  const user = await User.findByIdAndUpdate(req.params.id, { verificationStatus: req.body.verificationStatus }, { new: true }).select("-password -passwordResetToken -passwordResetExpires");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
};

export const adminSummary = async (req, res) => {
  const [users, requests, donations, applications] = await Promise.all([User.countDocuments(), ReliefRequest.countDocuments(), Donation.countDocuments(), VolunteerApplication.countDocuments()]);
  res.json({ success: true, data: { users, requests, donations, applications } });
};

export const listAdminRequests = async (req, res) => {
  const requests = await ReliefRequest.find().populate("requester", "name organizationName email").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: requests });
};

export const listAdminApplications = async (req, res) => {
  const applications = await VolunteerApplication.find().populate("volunteer", "name email location").populate("opportunity", "title organization").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: applications });
};
