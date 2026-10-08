import EmergencyAlert from "../models/EmergencyAlert.js"
import ReliefRequest from "../models/ReliefRequest.js"
import User from "../models/User.js"
import { getSmsProviderName, sendSms } from "./smsProvider.js"

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const validCoordinates = (coordinates) => Array.isArray(coordinates) && coordinates.length === 2 && coordinates.every(Number.isFinite)

export function distanceKm(first, second) {
  const radians = (degrees) => degrees * Math.PI / 180
  const [firstLongitude, firstLatitude] = first
  const [secondLongitude, secondLatitude] = second
  const latitudeDelta = radians(secondLatitude - firstLatitude)
  const longitudeDelta = radians(secondLongitude - firstLongitude)
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(firstLatitude)) * Math.cos(radians(secondLatitude)) * Math.sin(longitudeDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

export function requestTypeMatches(userTypes, request) {
  if (!userTypes?.length || userTypes.includes("ALL")) return true
  const selected = new Set(userTypes.map((type) => type.trim().toLowerCase()))
  return selected.has(request.disasterType.trim().toLowerCase()) || selected.has(request.category.trim().toLowerCase())
}

function quietMinutes(user, date) {
  const quiet = user.emergencyQuietHours
  if (!quiet?.enabled) return null
  const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: quiet.timezone || "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
  const parts = formatter.formatToParts(date)
  const current = Number(parts.find((part) => part.type === "hour")?.value) * 60 + Number(parts.find((part) => part.type === "minute")?.value)
  const toMinutes = (value) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3))
  const start = toMinutes(quiet.start || "22:00")
  const end = toMinutes(quiet.end || "07:00")
  const isQuiet = start < end ? current >= start && current < end : current >= start || current < end
  return isQuiet ? true : null
}

function findQuietHoursEnd(user, now) {
  for (let minute = 1; minute <= 24 * 60; minute += 1) {
    const candidate = new Date(now.getTime() + minute * 60_000)
    if (!quietMinutes(user, candidate)) return candidate
  }
  return new Date(now.getTime() + 24 * 60 * 60_000)
}

function messageForRequest(request) {
  const baseUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "")
  const template = process.env.EMERGENCY_SMS_TEMPLATE || "ReliefGrid alert: {{title}} near {{location}}. {{url}} If you can help, open the request. Emergencies: 112."
  return template
    .replaceAll("{{title}}", request.title.slice(0, 100))
    .replaceAll("{{location}}", request.location.slice(0, 100))
    .replaceAll("{{url}}", `${baseUrl}/requests/${request._id}`)
}

export async function queueEmergencyAlerts(request) {
  if (!request || request.isDemoData || !["HIGH", "CRITICAL"].includes(request.urgency) || !validCoordinates(request.geoLocation?.coordinates)) return { queued: 0 }
  const radiusKm = Math.min(100, Math.max(1, Number(process.env.EMERGENCY_ALERT_MAX_RADIUS_KM) || 100))
  const disasterType = request.disasterType.trim()
  const recipients = await User.find({
    emergencySmsOptIn: true,
    phoneVerifiedAt: { $ne: null },
    emergencyAlertLocation: {
      $near: { $geometry: request.geoLocation, $maxDistance: radiusKm * 1000 },
    },
  }).select("_id emergencyAlertLocation emergencyAlertRadiusKm emergencyAlertTypes")

  let queued = 0
  for (const recipient of recipients) {
    if (!validCoordinates(recipient.emergencyAlertLocation?.coordinates)) continue
    const distance = distanceKm(request.geoLocation.coordinates, recipient.emergencyAlertLocation.coordinates)
    if (distance > Math.min(100, recipient.emergencyAlertRadiusKm || 10) || !requestTypeMatches(recipient.emergencyAlertTypes, request)) continue
    try {
      await EmergencyAlert.create({
        request: request._id,
        recipient: recipient._id,
        provider: getSmsProviderName(),
        idempotencyKey: `${request._id}:${recipient._id}`,
      })
      queued += 1
    } catch (error) {
      if (error.code !== 11000) throw error
    }
  }
  return { queued }
}

export async function cancelAlertsForRequest(requestId) {
  await EmergencyAlert.updateMany(
    { request: requestId, status: { $in: ["QUEUED", "RETRY"] } },
    { $set: { status: "CANCELLED", lastError: "Request is no longer active" } },
  )
}

async function processOneAlert() {
  const now = new Date()
  const alert = await EmergencyAlert.findOneAndUpdate(
    { status: { $in: ["QUEUED", "RETRY"] }, nextAttemptAt: { $lte: now } },
    { $set: { status: "SENDING", lastError: "" }, $inc: { attempts: 1 } },
    { new: true, sort: { nextAttemptAt: 1 } },
  )
  if (!alert) return false

  const [request, recipient] = await Promise.all([
    ReliefRequest.findById(alert.request),
    User.findById(alert.recipient).select("phone phoneVerifiedAt emergencySmsOptIn emergencyQuietHours"),
  ])
  if (!request || ["RESOLVED", "CANCELLED"].includes(request.status) || !recipient || !recipient.emergencySmsOptIn || !recipient.phoneVerifiedAt) {
    await EmergencyAlert.updateOne({ _id: alert._id }, { $set: { status: "CANCELLED", lastError: "Request or recipient is no longer eligible" } })
    return true
  }

  if (request.urgency !== "CRITICAL" && quietMinutes(recipient, now)) {
    await EmergencyAlert.updateOne({ _id: alert._id }, {
      $set: { status: "QUEUED", nextAttemptAt: findQuietHoursEnd(recipient, now) },
      $inc: { attempts: -1 },
    })
    return true
  }

  try {
    const result = await sendSms({
      to: recipient.phone,
      body: messageForRequest(request),
      callbackUrl: process.env.PUBLIC_API_URL ? `${process.env.PUBLIC_API_URL.replace(/\/$/, "")}/api/emergency/${alert.provider === "gateway" ? "gateway" : "twilio"}/callback` : undefined,
      idempotencyKey: alert.idempotencyKey,
    })
    if (!result.accepted) {
      await EmergencyAlert.updateOne({ _id: alert._id }, { $set: { status: "MOCKED", provider: result.provider, lastError: "Development provider did not send a message" } })
    } else {
      await EmergencyAlert.updateOne({ _id: alert._id }, {
        $set: { status: "SENT", provider: result.provider, providerMessageId: result.providerMessageId, sentAt: new Date(), lastError: "" },
      })
    }
  } catch (error) {
    const attempts = alert.attempts
    const retryLimit = Math.max(1, Number(process.env.SMS_MAX_ATTEMPTS) || 5)
    const retry = attempts < retryLimit
    const backoffMs = Math.min(60 * 60_000, 30_000 * (2 ** Math.min(attempts - 1, 7)))
    await EmergencyAlert.updateOne({ _id: alert._id }, {
      $set: {
        status: retry ? "RETRY" : "FAILED",
        nextAttemptAt: new Date(Date.now() + backoffMs),
        lastError: String(error.message || "SMS provider error").slice(0, 500),
      },
    })
  }
  return true
}

let workerTimer
let processing = false
export async function startEmergencyAlertWorker() {
  if (workerTimer) return
  await EmergencyAlert.updateMany({ status: "SENDING" }, { $set: { status: "RETRY", nextAttemptAt: new Date(), lastError: "Recovered an interrupted send after restart" } })
  workerTimer = setInterval(async () => {
    if (processing) return
    processing = true
    try {
      const batchSize = Math.min(20, Math.max(1, Number(process.env.SMS_WORKER_BATCH_SIZE) || 5))
      for (let index = 0; index < batchSize; index += 1) {
        if (!await processOneAlert()) break
        await delay(Math.max(0, Number(process.env.SMS_MIN_INTERVAL_MS) || 1000))
      }
    } catch (error) {
      console.error("Emergency alert worker error:", error.message)
    } finally {
      processing = false
    }
  }, 5000)
  workerTimer.unref?.()
}
