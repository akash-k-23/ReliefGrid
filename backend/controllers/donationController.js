import Donation from "../models/Donation.js";
import DonationAudit from "../models/DonationAudit.js";
import EmergencyAlert from "../models/EmergencyAlert.js";
import EmergencyResponse from "../models/EmergencyResponse.js";
import ReliefRequest from "../models/ReliefRequest.js";
import VolunteerOpportunity from "../models/VolunteerOpportunity.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import { syncUserAchievements } from "../services/achievementService.js";

export const createDonation = async (req, res) => {
  try {
    const { requestId, donationType, item, quantity, amount, location, message, volunteerNeeded } = req.body;
    if (!requestId || !donationType || !item || !quantity || !location) {
      return res.status(400).json({ success: false, message: "Request, support type, item, quantity, and location are required" });
    }
    const request = await ReliefRequest.findOne({ _id: requestId, status: { $nin: ["RESOLVED", "CANCELLED"] } });
    if (!request) return res.status(404).json({ success: false, message: "Active request not found" });
    if (request.requester && request.requester.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You cannot donate to your own active request." });
    }
    const existing = await Donation.findOne({ donor: req.user._id, request: requestId, status: { $ne: "CANCELLED" } });
    if (existing) return res.status(409).json({ success: false, message: "You already have an active commitment for this request" });
    const donation = await Donation.create({ request: requestId, donationType, item, quantity, amount, location, message, volunteerNeeded: volunteerNeeded === true, donor: req.user._id });
    const alerted = await EmergencyAlert.exists({ request: requestId, recipient: req.user._id });
    if (alerted) await EmergencyResponse.updateOne({ request: requestId, recipient: req.user._id }, { $set: { request: requestId, recipient: req.user._id, response: "DONATION_PLEDGED", donation: donation._id, volunteerApplication: null } }, { upsert: true });
    if (volunteerNeeded === true) {
      const opportunityOwner = request.assignedOrganization || request.requester;
      const opportunity = await VolunteerOpportunity.create({
        title: `Volunteer support: ${request.title}`,
        description: `Volunteer assistance is needed for ${request.title}. ${request.description}`,
        location: request.location,
        geoLocation: request.geoLocation,
        category: request.category,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        requiredVolunteers: 1,
        organization: opportunityOwner,
        sourceRequest: request._id,
        sourceDonation: donation._id,
        isDemoData: request.isDemoData === true || donation.isDemoData === true,
      });
      donation.volunteerOpportunity = opportunity._id;
      await donation.save();
      await createNotification({ user: request.requester, type: "VOLUNTEER_OPPORTUNITY_CREATED", message: `Volunteer support was requested for: ${request.title}` });
      const ngos = await User.find({ role: "NGO", verificationStatus: "VERIFIED" }).select("_id");
      await Promise.all(ngos.map((ngo) => createNotification({ user: ngo._id, type: "VOLUNTEER_OPPORTUNITY_CREATED", message: `Volunteer support is needed for: ${request.title}` })));
    }
    await createNotification({ user: request.requester, type: "DONATION_COMMITMENT_CREATED", message: `Support was committed to your request: ${request.title}` });
    res.status(201).json({ success: true, message: "Support pledge recorded", data: donation });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

export const listMyDonations = async (req, res) => {
  const donations = await Donation.find({ donor: req.user._id })
    .populate("request", "title description location latitude longitude status requiredResources")
    .populate({ path: "volunteerOpportunity", populate: { path: "joinedVolunteers", select: "name phone location email" } })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: donations });
};

export const listRequestDonations = async (req, res) => {
  const requestIds = await ReliefRequest.find({ requester: req.user._id }).distinct("_id");
  const donations = await Donation.find({ request: { $in: requestIds } })
    .populate("donor", "name phone location email")
    .populate("request", "title description location latitude longitude status requiredResources")
    .populate({ path: "volunteerOpportunity", populate: { path: "joinedVolunteers", select: "name phone location email" } })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: donations });
};

export const updateDonationStatus = async (req, res) => {
  const allowedStatuses = ["RECEIVED", "ALLOCATED"];
  if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid donation status" });
  const donation = await Donation.findById(req.params.id).populate("request", "requester title");
  if (!donation) return res.status(404).json({ success: false, message: "Donation not found" });
  const isRequester = donation.request?.requester?.toString() === req.user._id.toString();
  const canManage = isRequester || (req.user.role === "NGO" && req.user.verificationStatus === "VERIFIED") || req.user.role === "ADMIN";
  if (!canManage) return res.status(403).json({ success: false, message: "You cannot update this donation" });
  const previousStatus = donation.status;
  donation.status = req.body.status;
  await donation.save();
  await DonationAudit.create({ donation: donation._id, actor: req.user._id, previousStatus, newStatus: donation.status });
  await syncUserAchievements(donation.donor);
  await createNotification({ user: donation.donor, type: "DONATION_STATUS_UPDATED", message: `Your support for ${donation.request.title} is now ${donation.status.toLowerCase()}.` });
  res.json({ success: true, message: `Donation marked ${donation.status.toLowerCase()}`, data: donation });
};

export const listDonations = async (req, res) => {
  const donations = await Donation.find().populate("donor", "name email organizationName").populate("request", "title location status").sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: donations });
};

export const cancelDonation = async (req, res) => {
  const donation = await Donation.findOne({ _id: req.params.id, donor: req.user._id, status: { $ne: "CANCELLED" } });
  if (!donation) return res.status(404).json({ success: false, message: "Active commitment not found" });
  donation.status = "CANCELLED";
  await donation.save();
  if (donation.volunteerOpportunity) {
    await VolunteerOpportunity.updateOne({ _id: donation.volunteerOpportunity, status: "OPEN" }, { $set: { status: "CANCELLED" } });
  }
  res.json({ success: true, message: "Commitment cancelled", data: donation });
};
