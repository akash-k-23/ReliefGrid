import User from "../models/User.js";
import ReliefRequest from "../models/ReliefRequest.js";
import VolunteerApplication from "../models/VolunteerApplication.js";
import Donation from "../models/Donation.js";

export const listUsers = async (req, res) => {
  const users = await User.find().select("-password -passwordResetToken -passwordResetExpires -phone -emergencyAlertLocation -phoneVerificationCodeHash -phoneVerificationExpiresAt -phoneVerificationSentAt -phoneVerificationCount -phoneVerificationWindowAt").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: users });
};

export const updateUserStatus = async (req, res) => {
  const allowed = ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"];
  if (!allowed.includes(req.body.verificationStatus)) return res.status(400).json({ success: false, message: "Invalid verification status" });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  user.verificationStatus = req.body.verificationStatus;
  if (req.body.verificationStatus === "SUSPENDED") {
    user.emergencySmsOptIn = false;
    user.emergencyAlertLocation = undefined;
    user.phoneVerificationCodeHash = null;
    user.phoneVerificationExpiresAt = null;
  }
  await user.save();
  user.set("password", undefined);
  user.set("passwordResetToken", undefined);
  user.set("passwordResetExpires", undefined);
  user.set("emergencyAlertLocation", undefined);
  res.json({ success: true, data: user });
};

export const adminSummary = async (req, res) => {
  const [users, requests, donations, applications] = await Promise.all([User.countDocuments(), ReliefRequest.countDocuments(), Donation.countDocuments(), VolunteerApplication.countDocuments()]);
  res.json({ success: true, data: { users, requests, donations, applications } });
};

export const listAdminRequests = async (req, res) => {
  const requests = await ReliefRequest.find().select("-contactPhone").populate("requester", "name organizationName email").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: requests });
};

export const listAdminApplications = async (req, res) => {
  const applications = await VolunteerApplication.find().populate("volunteer", "name email location").populate("opportunity", "title organization").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: applications });
};
