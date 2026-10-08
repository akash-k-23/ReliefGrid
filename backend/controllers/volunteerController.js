import VolunteerOpportunity from "../models/VolunteerOpportunity.js";
import VolunteerApplication from "../models/VolunteerApplication.js";
import VolunteerApplicationAudit from "../models/VolunteerApplicationAudit.js";
import EmergencyAlert from "../models/EmergencyAlert.js";
import EmergencyResponse from "../models/EmergencyResponse.js";
import { createNotification } from "../services/notificationService.js";
import { syncUserAchievements } from "../services/achievementService.js";

export const listOpportunities = async (req, res) => {
  const opportunities = await VolunteerOpportunity.find({ status: "OPEN", isDemoData: { $ne: true } }).populate("organization", "organizationName name location").sort({ date: 1 });
  res.json({ success: true, data: opportunities });
};

export const getOpportunity = async (req, res) => {
  const opportunity = await VolunteerOpportunity.findById(req.params.id)
    .populate("organization", "organizationName name location")
    .populate("joinedVolunteers", "name email location")
    .populate("sourceRequest")
    .populate("sourceDonation");
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
  if (req.user.role === "NGO" || req.user.role === "ADMIN") return res.status(403).json({ success: false, message: "NGO and admin accounts cannot apply as volunteers" });
  try {
    const existingApplication = await VolunteerApplication.findOne({
      volunteer: req.user._id,
      opportunity: req.params.id,
      status: { $nin: ["CANCELLED", "REJECTED"] },
    });
    if (existingApplication) return res.status(409).json({ success: false, message: "You already have an application for this opportunity" });
    const opportunity = await VolunteerOpportunity.findOneAndUpdate(
      { _id: req.params.id, status: "OPEN", $expr: { $lt: [{ $size: "$joinedVolunteers" }, "$requiredVolunteers"] } },
      { $addToSet: { joinedVolunteers: req.user._id }, $set: { status: "FULL" } },
      { new: true }
    );
    if (!opportunity) return res.status(404).json({ success: false, message: "Opportunity not found" });
    const application = await VolunteerApplication.create({ volunteer: req.user._id, opportunity: opportunity._id, skills: req.body.skills || [], availability: req.body.availability || "", status: "APPROVED" });
    if (opportunity.sourceRequest && await EmergencyAlert.exists({ request: opportunity.sourceRequest, recipient: req.user._id })) {
      await EmergencyResponse.updateOne({ request: opportunity.sourceRequest, recipient: req.user._id }, { $set: { request: opportunity.sourceRequest, recipient: req.user._id, response: "VOLUNTEER_PLEDGED", donation: null, volunteerApplication: application._id } }, { upsert: true });
    }
    await createNotification({ user: opportunity.organization, type: "VOLUNTEER_APPLICATION_SUBMITTED", message: `A volunteer applied for: ${opportunity.title}` });
    await createNotification({ user: req.user._id, type: "VOLUNTEER_ASSIGNMENT_ACCEPTED", message: `You are assigned to: ${opportunity.title}` });
    res.status(201).json({ success: true, message: "Volunteer assignment accepted", data: application });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "You already applied to this opportunity" });
    res.status(400).json({ success: false, message: error.message });
  }
};

export const listMyApplications = async (req, res) => {
  const applications = await VolunteerApplication.find({ volunteer: req.user._id })
    .populate("volunteer", "name email phone location")
    .populate({ path: "opportunity", populate: [
      { path: "sourceRequest", select: "title description disasterType urgency category peopleAffected location latitude longitude requiredResources status requester" },
      { path: "sourceDonation", select: "donationType item quantity amount location message status donor" },
      { path: "organization", select: "organizationName name location phone" },
    ] })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: applications });
};

export const updateApplication = async (req, res) => {
  const application = await VolunteerApplication.findById(req.params.id).populate("opportunity", "organization");
  if (!application) return res.status(404).json({ success: false, message: "Application not found" });
  const canManage = ["ADMIN", "NGO"].includes(req.user.role) && (req.user.role === "ADMIN" || application.opportunity.organization.toString() === req.user._id.toString());
  if (application.volunteer.toString() !== req.user._id.toString() && !canManage) return res.status(403).json({ success: false, message: "You cannot manage this application" });
  if (req.body.status && !["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid application status" });
  if (!canManage && req.body.status && req.body.status !== "CANCELLED") return res.status(403).json({ success: false, message: "Only the organization can approve applications" });
  if (req.body.verifiedHours !== undefined) {
    if (!canManage) return res.status(403).json({ success: false, message: "Only the organization or an admin can verify volunteer hours" });
    const hours = Number(req.body.verifiedHours);
    if (application.status !== "COMPLETED" && req.body.status !== "COMPLETED") return res.status(400).json({ success: false, message: "Volunteer hours can only be verified for completed activities" });
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) return res.status(400).json({ success: false, message: "Verified hours must be between 0 and 24" });
    application.verifiedHours = hours;
    application.hoursVerifiedAt = new Date();
    application.hoursVerifiedBy = req.user._id;
  }
  const previousStatus = application.status;
  const previousHours = application.verifiedHours;
  application.status = req.body.status || application.status;
  await application.save();
  if (previousStatus !== application.status || previousHours !== application.verifiedHours) {
    await VolunteerApplicationAudit.create({ application: application._id, actor: req.user._id, previousStatus, newStatus: application.status, previousHours, newHours: application.verifiedHours });
  }
  if (application.status === "COMPLETED") await syncUserAchievements(application.volunteer, req.user._id);
  res.json({ success: true, message: "Application updated", data: application });
};
