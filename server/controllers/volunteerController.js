import VolunteerOpportunity from "../models/VolunteerOpportunity.js";
import VolunteerApplication from "../models/VolunteerApplication.js";
import { createNotification } from "../services/notificationService.js";

export const listOpportunities = async (req, res) => {
  const opportunities = await VolunteerOpportunity.find({ status: { $in: ["OPEN", "FULL"] } }).populate("organization", "organizationName name location").sort({ date: 1 });
  res.json({ success: true, data: opportunities });
};

export const getOpportunity = async (req, res) => {
  const opportunity = await VolunteerOpportunity.findById(req.params.id).populate("organization", "organizationName name").populate("joinedVolunteers", "name email");
  if (!opportunity) return res.status(404).json({ success: false, message: "Opportunity not found" });
  res.json({ success: true, data: opportunity });
};

export const createOpportunity = async (req, res) => {
  const opportunity = await VolunteerOpportunity.create({ ...req.body, organization: req.user._id });
  res.status(201).json({ success: true, message: "Opportunity created", data: opportunity });
};

export const joinOpportunity = async (req, res) => {
  const opportunity = await VolunteerOpportunity.findById(req.params.id);
  if (!opportunity) return res.status(404).json({ success: false, message: "Opportunity not found" });
  if (opportunity.joinedVolunteers.some((id) => id.toString() === req.user._id.toString())) return res.status(409).json({ success: false, message: "You already joined this opportunity" });
  if (opportunity.joinedVolunteers.length >= opportunity.requiredVolunteers) return res.status(409).json({ success: false, message: "This opportunity is full" });
  opportunity.joinedVolunteers.push(req.user._id);
  if (opportunity.joinedVolunteers.length >= opportunity.requiredVolunteers) opportunity.status = "FULL";
  await opportunity.save();
  res.json({ success: true, message: "You joined the opportunity", data: opportunity });
};

export const leaveOpportunity = async (req, res) => {
  const opportunity = await VolunteerOpportunity.findById(req.params.id);
  if (!opportunity) return res.status(404).json({ success: false, message: "Opportunity not found" });
  opportunity.joinedVolunteers = opportunity.joinedVolunteers.filter((id) => id.toString() !== req.user._id.toString());
  if (opportunity.status === "FULL") opportunity.status = "OPEN";
  await opportunity.save();
  res.json({ success: true, message: "You left the opportunity", data: opportunity });
};

export const updateOpportunity = async (req, res) => {
  const opportunity = await VolunteerOpportunity.findById(req.params.id);
  if (!opportunity) return res.status(404).json({ success: false, message: "Opportunity not found" });
  if (opportunity.organization.toString() !== req.user._id.toString() && req.user.role !== "ADMIN") return res.status(403).json({ success: false, message: "You cannot manage this opportunity" });
  Object.assign(opportunity, req.body);
  await opportunity.save();
  res.json({ success: true, message: "Opportunity updated", data: opportunity });
};

export const applyToOpportunity = async (req, res) => {
  if (req.user.role !== "VOLUNTEER") return res.status(403).json({ success: false, message: "Only volunteer accounts can apply" });
  try {
    const opportunity = await VolunteerOpportunity.findOne({ _id: req.params.id, status: { $in: ["OPEN", "FULL"] } });
    if (!opportunity) return res.status(404).json({ success: false, message: "Opportunity not found" });
    const application = await VolunteerApplication.create({ volunteer: req.user._id, opportunity: opportunity._id, skills: req.body.skills || [], availability: req.body.availability || "" });
    await createNotification({ user: opportunity.organization, type: "VOLUNTEER_APPLICATION_SUBMITTED", message: `A volunteer applied for: ${opportunity.title}` });
    res.status(201).json({ success: true, message: "Volunteer application submitted", data: application });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "You already applied to this opportunity" });
    res.status(400).json({ success: false, message: error.message });
  }
};

export const listMyApplications = async (req, res) => {
  const applications = await VolunteerApplication.find({ volunteer: req.user._id }).populate("opportunity", "title location date status").sort({ createdAt: -1 });
  res.json({ success: true, data: applications });
};

export const updateApplication = async (req, res) => {
  const application = await VolunteerApplication.findById(req.params.id).populate("opportunity", "organization");
  if (!application) return res.status(404).json({ success: false, message: "Application not found" });
  const canManage = ["ADMIN", "NGO"].includes(req.user.role) && (req.user.role === "ADMIN" || application.opportunity.organization.toString() === req.user._id.toString());
  if (application.volunteer.toString() !== req.user._id.toString() && !canManage) return res.status(403).json({ success: false, message: "You cannot manage this application" });
  if (req.body.status && !["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid application status" });
  if (!canManage && req.body.status && req.body.status !== "CANCELLED") return res.status(403).json({ success: false, message: "Only the organization can approve applications" });
  application.status = req.body.status || application.status;
  await application.save();
  res.json({ success: true, message: "Application updated", data: application });
};
