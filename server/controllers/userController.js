import User from "../models/User.js";
import bcrypt from "bcryptjs";

const publicUser = (user) => ({ id: user._id, role: user.role, name: user.name, organizationName: user.organizationName, organizationType: user.organizationType, registrationNumber: user.registrationNumber, email: user.email, phone: user.phone, location: user.location, verificationStatus: user.verificationStatus });

export const getMe = (req, res) => res.json({ success: true, data: publicUser(req.user) });

export const updateMe = async (req, res) => {
  const allowed = ["name", "organizationName", "organizationType", "registrationNumber", "phone", "location"];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: "Profile updated", data: publicUser(user) });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) return res.status(400).json({ success: false, message: "Current password and a new password of at least 8 characters are required" });
  const user = await User.findById(req.user._id);
  if (!await bcrypt.compare(currentPassword, user.password)) return res.status(401).json({ success: false, message: "Current password is incorrect" });
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.json({ success: true, message: "Password changed successfully" });
};
