import { createHash, randomInt, timingSafeEqual } from "node:crypto"
import User from "../models/User.js"
import ReliefRequest from "../models/ReliefRequest.js"
import VolunteerOpportunity from "../models/VolunteerOpportunity.js"
import EmergencyAlert from "../models/EmergencyAlert.js"
import EmergencyResponse from "../models/EmergencyResponse.js"
import EmergencyContact from "../models/EmergencyContact.js"
import EmergencyContactAudit from "../models/EmergencyContactAudit.js"
import AbuseReport from "../models/AbuseReport.js"
import Donation from "../models/Donation.js"
import VolunteerApplication from "../models/VolunteerApplication.js"
import { createNotification } from "../services/notificationService.js"
import { getSmsProviderName, sendSms, verifyGatewayWebhookToken, verifyTwilioSignature } from "../services/smsProvider.js"
import { queueEmergencyAlerts, cancelAlertsForRequest, distanceKm, requestTypeMatches } from "../services/emergencyAlertService.js"
import { syncUserAchievements } from "../services/achievementService.js"

const allowedResponseTypes = ["ACCEPTED", "DECLINED", "DONATION_PLEDGED", "VOLUNTEER_PLEDGED"]
const validCoordinate = (value, minimum, maximum) => Number.isFinite(Number(value)) && Number(value) >= minimum && Number(value) <= maximum
const codeHash = (code) => createHash("sha256").update(`${process.env.JWT_SECRET}:${code}`).digest("hex")

export const getEmergencyPreferences = (req, res) => res.json({
  success: true,
  data: {
    emergencySmsOptIn: req.user.emergencySmsOptIn,
    phoneVerifiedAt: req.user.phoneVerifiedAt,
    alertLocation: req.user.emergencyAlertLocation || null,
    radiusKm: req.user.emergencyAlertRadiusKm,
    emergencyTypes: req.user.emergencyAlertTypes,
    quietHours: req.user.emergencyQuietHours,
  },
})

export const updateEmergencyPreferences = async (req, res) => {
  const { emergencySmsOptIn, latitude, longitude, radiusKm, emergencyTypes, quietHours } = req.body
  const allowedKeys = ["emergencySmsOptIn", "latitude", "longitude", "radiusKm", "emergencyTypes", "quietHours"]
  if (Object.keys(req.body).some((key) => !allowedKeys.includes(key))) return res.status(400).json({ success: false, message: "Unsupported preference field" })
  if (emergencySmsOptIn !== undefined && typeof emergencySmsOptIn !== "boolean") return res.status(400).json({ success: false, message: "SMS preference must be true or false" })
  const user = await User.findById(req.user._id)
  if (!user) return res.status(404).json({ success: false, message: "User not found" })

  if (emergencySmsOptIn === true) {
    if (!user.phoneVerifiedAt) return res.status(400).json({ success: false, message: "Verify your phone before opting in to emergency SMS" })
    if (!validCoordinate(latitude, -90, 90) || !validCoordinate(longitude, -180, 180)) return res.status(400).json({ success: false, message: "A valid alert location is required to opt in" })
    if (!Number.isInteger(Number(radiusKm)) || Number(radiusKm) < 1 || Number(radiusKm) > 100) return res.status(400).json({ success: false, message: "Alert radius must be between 1 and 100 km" })
    if (!Array.isArray(emergencyTypes) || emergencyTypes.length < 1 || emergencyTypes.length > 20 || emergencyTypes.some((type) => typeof type !== "string" || !type.trim() || type.length > 60)) return res.status(400).json({ success: false, message: "Select one or more valid emergency types" })
    user.emergencyAlertLocation = { type: "Point", coordinates: [Number(longitude), Number(latitude)] }
    user.emergencyAlertRadiusKm = Number(radiusKm)
    user.emergencyAlertTypes = [...new Set(emergencyTypes.map((type) => type.trim()))]
  } else if (latitude !== undefined || longitude !== undefined) {
    if (!validCoordinate(latitude, -90, 90) || !validCoordinate(longitude, -180, 180)) return res.status(400).json({ success: false, message: "Alert coordinates must be valid latitude and longitude values" })
    user.emergencyAlertLocation = { type: "Point", coordinates: [Number(longitude), Number(latitude)] }
  }

  if (radiusKm !== undefined && (Number(radiusKm) < 1 || Number(radiusKm) > 100)) return res.status(400).json({ success: false, message: "Alert radius must be between 1 and 100 km" })
  if (radiusKm !== undefined) user.emergencyAlertRadiusKm = Number(radiusKm)
  if (emergencyTypes !== undefined && emergencySmsOptIn !== true) {
    if (!Array.isArray(emergencyTypes) || emergencyTypes.length > 20 || emergencyTypes.some((type) => typeof type !== "string" || !type.trim() || type.length > 60)) return res.status(400).json({ success: false, message: "Select valid emergency types" })
    user.emergencyAlertTypes = [...new Set(emergencyTypes.map((type) => type.trim()))]
  }
  if (quietHours !== undefined) {
    if (!quietHours || typeof quietHours.enabled !== "boolean" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(quietHours.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(quietHours.end)) return res.status(400).json({ success: false, message: "Quiet hours need valid 24-hour start and end times" })
    user.emergencyQuietHours = { enabled: quietHours.enabled, start: quietHours.start, end: quietHours.end, timezone: "Asia/Kolkata" }
  }
  if (emergencySmsOptIn !== undefined) user.emergencySmsOptIn = emergencySmsOptIn
  if (!user.emergencySmsOptIn) user.emergencyAlertLocation = undefined
  await user.save()
  res.json({ success: true, message: "Emergency alert preferences saved", data: { emergencySmsOptIn: user.emergencySmsOptIn, phoneVerifiedAt: user.phoneVerifiedAt, radiusKm: user.emergencyAlertRadiusKm, emergencyTypes: user.emergencyAlertTypes, quietHours: user.emergencyQuietHours } })
}

export const sendPhoneVerification = async (req, res) => {
  if (!["twilio", "gateway"].includes(getSmsProviderName())) return res.status(503).json({ success: false, message: "Phone verification requires a configured live SMS provider" })
  const user = await User.findById(req.user._id).select("+phoneVerificationCodeHash +phoneVerificationExpiresAt +phoneVerificationSentAt +phoneVerificationCount +phoneVerificationWindowAt")
  if (!user || !/^\+[1-9]\d{7,14}$/.test(user.phone)) return res.status(400).json({ success: false, message: "Set your phone number in international E.164 format before verification" })
  const now = new Date()
  if (user.phoneVerificationSentAt && now - user.phoneVerificationSentAt < 60_000) return res.status(429).json({ success: false, message: "Wait one minute before requesting another code" })
  if (!user.phoneVerificationWindowAt || now - user.phoneVerificationWindowAt > 60 * 60_000) {
    user.phoneVerificationWindowAt = now
    user.phoneVerificationCount = 0
  }
  if (user.phoneVerificationCount >= 5) return res.status(429).json({ success: false, message: "Verification limit reached; try again in one hour" })
  const code = String(randomInt(100000, 1000000))
  user.phoneVerificationCodeHash = codeHash(code)
  user.phoneVerificationExpiresAt = new Date(now.getTime() + 10 * 60_000)
  user.phoneVerificationSentAt = now
  user.phoneVerificationCount += 1
  await user.save()
  try {
    await sendSms({ to: user.phone, body: `Your ReliefGrid phone verification code is ${code}. It expires in 10 minutes.` })
  } catch (error) {
    user.phoneVerificationCodeHash = null
    user.phoneVerificationExpiresAt = null
    await user.save()
    return res.status(502).json({ success: false, message: "The verification message could not be sent" })
  }
  res.json({ success: true, message: "Verification code sent; it expires in 10 minutes" })
}

export const verifyPhone = async (req, res) => {
  const code = String(req.body.code || "")
  if (!/^\d{6}$/.test(code)) return res.status(400).json({ success: false, message: "Enter the six-digit verification code" })
  const user = await User.findById(req.user._id).select("+phoneVerificationCodeHash +phoneVerificationExpiresAt")
  const actualHash = user?.phoneVerificationCodeHash || ""
  const suppliedHash = codeHash(code)
  const matches = actualHash.length === suppliedHash.length && timingSafeEqual(Buffer.from(actualHash), Buffer.from(suppliedHash))
  if (!user || !matches || !user.phoneVerificationExpiresAt || user.phoneVerificationExpiresAt < new Date()) return res.status(400).json({ success: false, message: "Verification code is invalid or expired" })
  user.phoneVerifiedAt = new Date()
  user.phoneVerificationCodeHash = null
  user.phoneVerificationExpiresAt = null
  await user.save()
  res.json({ success: true, message: "Phone number verified", data: { phoneVerifiedAt: user.phoneVerifiedAt } })
}

export const listMyAlerts = async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 15))
  const filter = { recipient: req.user._id }
  const [items, total] = await Promise.all([
    EmergencyAlert.find(filter).populate("request", "title location urgency status createdAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select("request provider status attempts lastError sentAt deliveredAt createdAt"),
    EmergencyAlert.countDocuments(filter),
  ])
  const responses = await EmergencyResponse.find({ recipient: req.user._id, request: { $in: items.map((item) => item.request?._id).filter(Boolean) } }).select("request response updatedAt").lean()
  const responseByRequest = new Map(responses.map((response) => [response.request.toString(), response]))
  res.json({ success: true, data: { items: items.map((item) => ({ ...item.toObject(), response: responseByRequest.get(item.request?._id?.toString()) || null })), page, limit, total, hasMore: page * limit < total } })
}

export const respondToAlert = async (req, res) => {
  const { response, donationId, applicationId } = req.body
  if (!allowedResponseTypes.includes(response)) return res.status(400).json({ success: false, message: "Invalid emergency response" })
  const alert = await EmergencyAlert.findOne({ request: req.params.requestId, recipient: req.user._id, status: { $nin: ["CANCELLED", "FAILED"] } })
  if (!alert) return res.status(404).json({ success: false, message: "This request is not in your emergency alert history" })
  const request = await ReliefRequest.findById(req.params.requestId)
  if (!request || ["RESOLVED", "CANCELLED"].includes(request.status)) return res.status(409).json({ success: false, message: "This request is no longer active" })
  const updates = { request: request._id, recipient: req.user._id, response }
  if (response === "DONATION_PLEDGED") {
    const donation = await Donation.findOne({ _id: donationId, donor: req.user._id, request: request._id, status: { $ne: "CANCELLED" } }).select("_id")
    if (!donation) return res.status(400).json({ success: false, message: "Use the existing donation workflow for this request, then link its commitment" })
    updates.donation = donation._id
  }
  if (response === "VOLUNTEER_PLEDGED") {
    const application = await VolunteerApplication.findOne({ _id: applicationId, volunteer: req.user._id }).populate("opportunity", "sourceRequest")
    if (!application || application.opportunity?.sourceRequest?.toString() !== request._id.toString()) return res.status(400).json({ success: false, message: "Use an existing volunteer assignment linked to this request" })
    updates.volunteerApplication = application._id
  }
  const result = await EmergencyResponse.findOneAndUpdate({ request: request._id, recipient: req.user._id }, { $set: updates }, { new: true, upsert: true, runValidators: true })
  await createNotification({ user: request.requester, type: "EMERGENCY_RESPONSE", message: `A responder ${response === "DECLINED" ? "declined" : "updated their response to"} ${request.title}.` })
  res.json({ success: true, message: "Response recorded", data: result })
}

export const listEmergencyContacts = async (_req, res) => {
  const contacts = await EmergencyContact.find({ enabled: true }).select("key name number category availability notes isNational updatedAt").sort({ isNational: -1, category: 1, name: 1 }).lean()
  res.json({ success: true, data: contacts })
}

export const listAdminEmergencyContacts = async (_req, res) => {
  const contacts = await EmergencyContact.find().sort({ enabled: -1, isNational: -1, category: 1, name: 1 }).lean()
  res.json({ success: true, data: contacts })
}

export const nearbyHelp = async (req, res) => {
  const coordinates = req.user.emergencyAlertLocation?.coordinates
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return res.json({ success: true, data: { requests: [], opportunities: [], message: "Set an alert location to see nearby support" } })
  const radiusKm = Math.min(100, req.user.emergencyAlertRadiusKm || 10)
  const near = { $near: { $geometry: req.user.emergencyAlertLocation, $maxDistance: radiusKm * 1000 } }
  const [requests, opportunities] = await Promise.all([
    ReliefRequest.find({ geoLocation: near, status: { $nin: ["RESOLVED", "CANCELLED"] }, isDemoData: { $ne: true } }).select("title urgency category location status createdAt").limit(8).lean(),
    VolunteerOpportunity.find({ geoLocation: near, status: "OPEN", isDemoData: { $ne: true } }).select("title category location date status").limit(8).lean(),
  ])
  res.json({ success: true, data: { requests, opportunities, radiusKm } })
}

export const handleTwilioCallback = async (req, res) => {
  const callbackUrl = `${(process.env.PUBLIC_API_URL || "").replace(/\/$/, "")}${req.originalUrl}`
  if (!verifyTwilioSignature(callbackUrl, req.body, req.get("X-Twilio-Signature"))) return res.status(403).json({ success: false, message: "Invalid callback signature" })
  const mapping = { delivered: "DELIVERED", failed: "FAILED", undelivered: "FAILED", queued: "SENT", accepted: "SENT", sending: "SENT", sent: "SENT" }
  const status = mapping[String(req.body.MessageStatus || "").toLowerCase()]
  if (!status || !req.body.MessageSid) return res.status(400).json({ success: false, message: "Unsupported provider callback" })
  const update = { status }
  if (status === "DELIVERED") update.deliveredAt = new Date()
  if (status === "FAILED") update.lastError = "Provider reported delivery failure"
  await EmergencyAlert.updateOne({ provider: "twilio", providerMessageId: req.body.MessageSid }, { $set: update })
  res.json({ success: true })
}

export const handleGatewayCallback = async (req, res) => {
  if (!verifyGatewayWebhookToken(req.get("X-ReliefGrid-Webhook-Token"))) return res.status(403).json({ success: false, message: "Invalid callback token" })
  const providerMessageId = String(req.body.messageId || "")
  const mapping = { delivered: "DELIVERED", failed: "FAILED", undelivered: "FAILED", sent: "SENT", accepted: "SENT" }
  const status = mapping[String(req.body.status || "").toLowerCase()]
  if (!providerMessageId || !status) return res.status(400).json({ success: false, message: "Unsupported provider callback" })
  const update = { status }
  if (status === "DELIVERED") update.deliveredAt = new Date()
  if (status === "FAILED") update.lastError = "Provider reported delivery failure"
  await EmergencyAlert.updateOne({ provider: "gateway", providerMessageId }, { $set: update })
  res.json({ success: true })
}

export const listAdminAlerts = async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit, 10) || 100))
  const items = await EmergencyAlert.find().populate("request", "title urgency status location").populate("recipient", "name role").sort({ createdAt: -1 }).limit(limit).lean()
  const responses = await EmergencyResponse.find({ request: { $in: [...new Set(items.map((item) => item.request?._id).filter(Boolean))] } }).populate("recipient", "name role").sort({ updatedAt: -1 }).lean()
  res.json({ success: true, data: { alerts: items, responses } })
}

export const listEligibleAlertRecipients = async (req, res) => {
  const requestId = String(req.query.requestId || "")
  if (!/^[\da-f]{24}$/i.test(requestId)) return res.status(400).json({ success: false, message: "A valid requestId is required" })
  const request = await ReliefRequest.findById(requestId).select("title urgency disasterType category status geoLocation")
  if (!request) return res.status(404).json({ success: false, message: "Request not found" })
  if (["RESOLVED", "CANCELLED"].includes(request.status) || !["HIGH", "CRITICAL"].includes(request.urgency) || !Array.isArray(request.geoLocation?.coordinates)) {
    return res.json({ success: true, data: { request: { id: request._id, title: request.title, status: request.status }, eligibleCount: 0, users: [] } })
  }
  const recipients = await User.find({
    emergencySmsOptIn: true,
    phoneVerifiedAt: { $ne: null },
    emergencyAlertLocation: { $near: { $geometry: request.geoLocation, $maxDistance: 100_000 } },
  }).select("name organizationName role emergencyAlertLocation emergencyAlertRadiusKm emergencyAlertTypes")
  const eligible = recipients.flatMap((recipient) => {
    const coordinates = recipient.emergencyAlertLocation?.coordinates
    if (!Array.isArray(coordinates) || !requestTypeMatches(recipient.emergencyAlertTypes, request)) return []
    const distance = distanceKm(request.geoLocation.coordinates, coordinates)
    if (distance > Math.min(100, recipient.emergencyAlertRadiusKm || 10)) return []
    return [{ id: recipient._id, name: recipient.name || recipient.organizationName, role: recipient.role, radiusKm: recipient.emergencyAlertRadiusKm, approximateDistanceKm: Math.round(distance) }]
  })
  res.json({ success: true, data: { request: { id: request._id, title: request.title, status: request.status }, eligibleCount: eligible.length, users: eligible } })
}

export const adminRecalculateAchievements = async (req, res) => {
  const result = await syncUserAchievements(req.params.userId, req.user._id)
  res.json({ success: true, data: result.progress })
}

const contactFields = ["name", "number", "category", "availability", "notes", "isNational", "enabled"]
const contactSnapshot = (contact) => contact ? Object.fromEntries(contactFields.map((field) => [field, contact[field]])) : null

export const createEmergencyContact = async (req, res) => {
  const { key, ...body } = req.body
  if (typeof key !== "string" || !/^[a-z0-9-]{3,80}$/.test(key) || !body.name || !/^\+?[0-9]{2,10}$/.test(String(body.number || "")) || !body.category || !body.availability) return res.status(400).json({ success: false, message: "A valid key, name, phone number, category, and availability are required" })
  const updates = Object.fromEntries(Object.entries(body).filter(([field]) => contactFields.includes(field)))
  try {
    const contact = await EmergencyContact.create({ ...updates, key, updatedBy: req.user._id })
    await EmergencyContactAudit.create({ contact: contact._id, key, action: "CREATED", after: contactSnapshot(contact), performedBy: req.user._id })
    res.status(201).json({ success: true, data: contact })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Contact key already exists" })
    throw error
  }
}

export const updateEmergencyContact = async (req, res) => {
  const contact = await EmergencyContact.findOne({ key: req.params.key })
  if (!contact) return res.status(404).json({ success: false, message: "Emergency contact not found" })
  const before = contactSnapshot(contact)
  const updates = Object.fromEntries(Object.entries(req.body).filter(([field]) => contactFields.includes(field)))
  if (updates.number !== undefined && !/^\+?[0-9]{2,10}$/.test(String(updates.number))) return res.status(400).json({ success: false, message: "Invalid phone number" })
  Object.assign(contact, updates, { updatedBy: req.user._id })
  await contact.save()
  await EmergencyContactAudit.create({ contact: contact._id, key: contact.key, action: contact.enabled ? "UPDATED" : "DISABLED", before, after: contactSnapshot(contact), performedBy: req.user._id })
  res.json({ success: true, data: contact })
}

export const listEmergencyContactAudit = async (_req, res) => {
  const data = await EmergencyContactAudit.find().populate("performedBy", "name email").sort({ createdAt: -1 }).limit(200).lean()
  res.json({ success: true, data })
}

export const createAbuseReport = async (req, res) => {
  const { targetType, targetId, reason, details = "" } = req.body
  if (!["REQUEST", "ALERT", "USER"].includes(targetType) || !["SPAM", "MISINFORMATION", "ABUSE", "PRIVACY", "OTHER"].includes(reason) || !/^[\da-f]{24}$/i.test(String(targetId || "")) || typeof details !== "string" || details.length > 1000) {
    return res.status(400).json({ success: false, message: "Provide a valid report target, reason, and optional details" })
  }
  if (await AbuseReport.countDocuments({ reporter: req.user._id, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60_000) } }) >= 5) {
    return res.status(429).json({ success: false, message: "Report limit reached; try again later" })
  }
  const report = { reporter: req.user._id, targetType, reason, details: details.trim() }
  if (targetType === "REQUEST") {
    if (!await ReliefRequest.exists({ _id: targetId })) return res.status(404).json({ success: false, message: "Request not found" })
    report.targetRequest = targetId
  } else if (targetType === "ALERT") {
    if (!await EmergencyAlert.exists({ _id: targetId, recipient: req.user._id })) return res.status(404).json({ success: false, message: "Alert not found" })
    report.targetAlert = targetId
  } else {
    if (targetId === req.user._id.toString() || !await User.exists({ _id: targetId })) return res.status(404).json({ success: false, message: "User not found" })
    report.targetUser = targetId
  }
  try {
    const created = await AbuseReport.create(report)
    res.status(201).json({ success: true, message: "Report submitted for admin review", data: created })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "You have already reported this item" })
    throw error
  }
}

export const listAbuseReports = async (_req, res) => {
  const reports = await AbuseReport.find()
    .populate("reporter", "name role")
    .populate("targetRequest", "title status")
    .populate("targetAlert", "status request")
    .populate("targetUser", "name role verificationStatus")
    .populate("reviewedBy", "name")
    .sort({ createdAt: -1 }).limit(200).lean()
  res.json({ success: true, data: reports })
}

export const reviewAbuseReport = async (req, res) => {
  const { status, reviewNotes = "" } = req.body
  if (!["REVIEWED", "DISMISSED"].includes(status) || typeof reviewNotes !== "string" || reviewNotes.length > 1000) return res.status(400).json({ success: false, message: "Invalid report review update" })
  const report = await AbuseReport.findByIdAndUpdate(req.params.id, { status, reviewNotes: reviewNotes.trim(), reviewedBy: req.user._id, reviewedAt: new Date() }, { new: true, runValidators: true })
  if (!report) return res.status(404).json({ success: false, message: "Report not found" })
  res.json({ success: true, data: report })
}

export async function notifyRequestAlerts(request) {
  try {
    return await queueEmergencyAlerts(request)
  } catch (error) {
    console.error("Emergency alert queueing failed:", error.message)
    return { queued: 0, error: "Alert queue unavailable" }
  }
}

export async function cancelRequestAlerts(requestId) {
  await cancelAlertsForRequest(requestId)
}
