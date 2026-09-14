import Donation from "../models/Donation.js";
import ReliefRequest from "../models/ReliefRequest.js";
import { createNotification } from "../services/notificationService.js";

export const createDonation = async (req, res) => {
  try {
    const { requestId, donationType, item, quantity, amount, location, message } = req.body;
    if (!requestId || !donationType || !item || !quantity || !location) {
      return res.status(400).json({ success: false, message: "Request, support type, item, quantity, and location are required" });
    }
    const request = await ReliefRequest.findOne({ _id: requestId, status: { $nin: ["RESOLVED", "CANCELLED"] } });
    if (!request) return res.status(404).json({ success: false, message: "Active request not found" });
    const existing = await Donation.findOne({ donor: req.user._id, request: requestId, status: { $ne: "CANCELLED" } });
    if (existing) return res.status(409).json({ success: false, message: "You already have an active commitment for this request" });
    const donation = await Donation.create({ request: requestId, donationType, item, quantity, amount, location, message, donor: req.user._id });
    await createNotification({ user: request.requester, type: "DONATION_COMMITMENT_CREATED", message: `Support was committed to your request: ${request.title}` });
    res.status(201).json({ success: true, message: "Support pledge recorded", data: donation });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

export const listMyDonations = async (req, res) => {
  const donations = await Donation.find({ donor: req.user._id }).populate("request", "title location status").sort({ createdAt: -1 });
  res.json({ success: true, data: donations });
};

export const listDonations = async (req, res) => {
  const donations = await Donation.find().populate("donor", "name email organizationName").populate("request", "title location status").sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: donations });
};

export const cancelDonation = async (req, res) => {
  const donation = await Donation.findOneAndUpdate(
    { _id: req.params.id, donor: req.user._id, status: { $ne: "CANCELLED" } },
    { status: "CANCELLED" },
    { new: true }
  );
  if (!donation) return res.status(404).json({ success: false, message: "Active commitment not found" });
  res.json({ success: true, message: "Commitment cancelled", data: donation });
};
