import "dotenv/config"
import mongoose from "mongoose"
import ReliefRequest from "../models/ReliefRequest.js"
import User from "../models/User.js"
import VolunteerOpportunity from "../models/VolunteerOpportunity.js"
import Achievement from "../models/Achievement.js"
import EmergencyAlert from "../models/EmergencyAlert.js"
import EmergencyResponse from "../models/EmergencyResponse.js"
import EmergencyContact from "../models/EmergencyContact.js"
import AbuseReport from "../models/AbuseReport.js"

const batchLimit = 500

async function writeBatch(model, operations) {
  if (operations.length) await model.bulkWrite(operations, { ordered: false })
}

async function migrate() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required")
  await mongoose.connect(process.env.MONGODB_URI)

  let requestOperations = []
  let requestCount = 0
  const requestCursor = ReliefRequest.find({ latitude: { $type: "number" }, longitude: { $type: "number" } }).select("latitude longitude").cursor()
  for await (const request of requestCursor) {
    if (request.latitude < -90 || request.latitude > 90 || request.longitude < -180 || request.longitude > 180) continue
    const geoLocation = { type: "Point", coordinates: [request.longitude, request.latitude] }
    requestOperations.push({ updateOne: { filter: { _id: request._id }, update: { $set: { geoLocation } } } })
    if (requestOperations.length >= batchLimit) {
      await writeBatch(ReliefRequest, requestOperations)
      requestCount += requestOperations.length
      requestOperations = []
    }
  }
  await writeBatch(ReliefRequest, requestOperations)
  requestCount += requestOperations.length

  let opportunityBatch = []
  let opportunityCount = 0
  const opportunityCursor = VolunteerOpportunity.find({ sourceRequest: { $ne: null } }).select("sourceRequest").cursor()
  for await (const opportunity of opportunityCursor) {
    opportunityBatch.push(opportunity)
    if (opportunityBatch.length >= batchLimit) {
      opportunityCount += await migrateOpportunityBatch(opportunityBatch)
      opportunityBatch = []
    }
  }
  opportunityCount += await migrateOpportunityBatch(opportunityBatch)

  await Promise.all([
    User.collection.createIndex({ emergencyAlertLocation: "2dsphere" }),
    ReliefRequest.collection.createIndex({ geoLocation: "2dsphere" }),
    VolunteerOpportunity.collection.createIndex({ geoLocation: "2dsphere" }),
    Achievement.collection.createIndex({ user: 1, badgeId: 1 }, { unique: true }),
    EmergencyAlert.collection.createIndex({ idempotencyKey: 1 }, { unique: true }),
    EmergencyAlert.collection.createIndex({ request: 1, recipient: 1 }, { unique: true }),
    EmergencyResponse.collection.createIndex({ request: 1, recipient: 1 }, { unique: true }),
    EmergencyContact.collection.createIndex({ key: 1 }, { unique: true }),
    AbuseReport.collection.createIndex({ reporter: 1, targetType: 1, targetRequest: 1, targetAlert: 1, targetUser: 1 }, { unique: true }),
  ])
  console.log(`Emergency migration complete: ${requestCount} requests, ${opportunityCount} opportunities, spatial and uniqueness indexes.`)
}

async function migrateOpportunityBatch(opportunities) {
  if (!opportunities.length) return 0
  const requests = await ReliefRequest.find({ _id: { $in: opportunities.map((item) => item.sourceRequest) }, geoLocation: { $exists: true } }).select("geoLocation").lean()
  const locations = new Map(requests.map((request) => [request._id.toString(), request.geoLocation]))
  const operations = opportunities.flatMap((opportunity) => {
    const geoLocation = locations.get(opportunity.sourceRequest.toString())
    return geoLocation ? [{ updateOne: { filter: { _id: opportunity._id }, update: { $set: { geoLocation } } } }] : []
  })
  await writeBatch(VolunteerOpportunity, operations)
  return operations.length
}

migrate()
  .catch((error) => {
    console.error("Emergency geo migration failed:", error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect()
  })
