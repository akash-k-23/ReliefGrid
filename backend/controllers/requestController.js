import ReliefRequest from "../models/ReliefRequest.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";

const requestStatuses = ["PENDING", "REVIEWED", "IN_PROGRESS", "ASSIGNED", "RESOLVED", "CANCELLED"];
const editableFields = ["title", "description", "disasterType", "urgency", "category", "peopleAffected", "location", "latitude", "longitude", "contactPhone", "requiredResources"];

const filterFields = (body, fields) => Object.fromEntries(
  Object.entries(body).filter(([key, value]) => fields.includes(key) && value !== undefined)
);

export const createRequest = async (req, res) => {
  try {
    const request = await ReliefRequest.create({ ...filterFields(req.body, editableFields), requester: req.user._id });
    const ngos = await User.find({ role: "NGO", verificationStatus: "VERIFIED" }).select("_id");
    await Promise.all(ngos.map((ngo) => createNotification({ user: ngo._id, type: "REQUEST_CREATED", message: `New relief request: ${request.title}` })));
    res.status(201).json({ success: true, message: "Relief request submitted", data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const listRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.urgency) filter.urgency = req.query.urgency;
    if (req.query.category) filter.category = req.query.category;
    const requests = await ReliefRequest.find(filter).populate("requester", "name organizationName location").populate("assignedOrganization", "organizationName name").sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to load requests" }); }
};

export const listPublicRequests = async (req, res) => {
  try {
    const filter = { status: { $nin: ["RESOLVED", "CANCELLED"] } };
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    if (req.query.status) {
      if (!requestStatuses.includes(req.query.status)) return res.status(400).json({ success: false, message: "Invalid request status" });
      filter.status = req.query.status;
    }
    if (req.query.urgency) filter.urgency = req.query.urgency;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.location) filter.location = { $regex: req.query.location.trim(), $options: "i" };
    if (req.query.search) {
      const search = req.query.search.trim();
      filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }];
    }
    const requests = await ReliefRequest.find(filter)
      .select("title description disasterType urgency category peopleAffected location latitude longitude requiredResources status requester createdAt")
      .populate("requester", "name organizationName location")
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load public requests" });
  }
};

export const listMyRequests = async (req, res) => {
  const requests = await ReliefRequest.find({ requester: req.user._id }).populate("assignedOrganization", "organizationName name").sort({ createdAt: -1 });
  res.json({ success: true, data: requests });
};

export const getRequest = async (req, res) => {
  const request = await ReliefRequest.findById(req.params.id).populate("requester", "name organizationName location phone").populate("assignedOrganization", "organizationName name");
  if (!request) return res.status(404).json({ success: false, message: "Request not found" });
  res.json({ success: true, data: request });
};

export const updateRequest = async (req, res) => {
  const request = await ReliefRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ success: false, message: "Request not found" });
  const isOwner = request.requester.toString() === req.user._id.toString();
  const canManage = req.user.role === "ADMIN" || (req.user.role === "NGO" && req.user.verificationStatus === "VERIFIED");
  if (!isOwner && !canManage) return res.status(403).json({ success: false, message: "You cannot update this request" });
  const updates = filterFields(req.body, editableFields);
  if (canManage && req.body.assignedOrganization !== undefined) updates.assignedOrganization = req.body.assignedOrganization;
  if (canManage && req.body.status !== undefined) {
    if (!requestStatuses.includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid request status" });
    updates.status = req.body.status;
  }
  Object.assign(request, updates);
  await request.save();
  res.json({ success: true, message: "Request updated", data: request });
};

export const updateRequestStatus = async (req, res) => {
  if (req.user.role !== "ADMIN" && !(req.user.role === "NGO" && req.user.verificationStatus === "VERIFIED")) return res.status(403).json({ success: false, message: "A verified NGO or admin account is required" });
  if (!requestStatuses.includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid request status" });
  const request = await ReliefRequest.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  if (!request) return res.status(404).json({ success: false, message: "Request not found" });
  res.json({ success: true, message: "Request status updated", data: request });
};

export const deleteRequest = async (req, res) => {
  const request = await ReliefRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ success: false, message: "Request not found" });
  if (request.requester.toString() !== req.user._id.toString() && req.user.role !== "ADMIN") return res.status(403).json({ success: false, message: "You cannot delete this request" });
  await request.deleteOne();
  res.json({ success: true, message: "Request deleted" });
};
