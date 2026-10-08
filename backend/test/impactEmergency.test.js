import test from "node:test"
import assert from "node:assert/strict"
import { getAchievementProgress } from "../services/achievementService.js"
import { distanceKm } from "../services/emergencyAlertService.js"
import { sendSms } from "../services/smsProvider.js"
import ReliefRequest from "../models/ReliefRequest.js"
import User from "../models/User.js"
import mongoose from "mongoose"
import { defaultEmergencyContacts } from "../config/emergencyContacts.js"

test("donation badges unlock only at configured verified-count thresholds", () => {
  const below = getAchievementProgress({ donations: 4 })
  const at = getAchievementProgress({ donations: 5 })
  assert.equal(below.find((badge) => badge.badgeId === "generous-heart").unlocked, false)
  assert.equal(at.find((badge) => badge.badgeId === "generous-heart").unlocked, true)
  assert.equal(at.find((badge) => badge.badgeId === "helping-hand").unlocked, false)
})

test("volunteer and combined badges use backend contribution counts", () => {
  const progress = getAchievementProgress({ donations: 2, volunteerActivities: 3 })
  assert.equal(progress.find((badge) => badge.badgeId === "active-volunteer").unlocked, false)
  assert.equal(progress.find((badge) => badge.badgeId === "first-responder").unlocked, true)
  assert.equal(progress.find((badge) => badge.badgeId === "disaster-supporter").unlocked, true)
  assert.equal(progress.find((badge) => badge.badgeId === "community-hero").progress, 33)
})

test("distance calculation uses GeoJSON longitude-latitude ordering", () => {
  const justInside = distanceKm([0, 0], [0, 0.89])
  const justOutside = distanceKm([0, 0], [0, 0.91])
  assert.ok(justInside < 100)
  assert.ok(justOutside > 100)
  assert.equal(distanceKm([0, 0], [0, 0]), 0)
})

test("mock SMS provider never reports a real send or delivery", async () => {
  const previous = process.env.SMS_PROVIDER
  process.env.SMS_PROVIDER = "mock"
  try {
    const result = await sendSms({ to: "+919876543210", body: "test" })
    assert.deepEqual(result, { provider: "mock", accepted: false, status: "MOCKED", providerMessageId: null })
  } finally {
    if (previous === undefined) delete process.env.SMS_PROVIDER
    else process.env.SMS_PROVIDER = previous
  }
})

test("legacy request latitude and longitude validate into GeoJSON longitude-latitude order", async () => {
  const request = new ReliefRequest({ requester: new mongoose.Types.ObjectId(), title: "Need water", description: "Urgent drinking water needed", category: "Water", location: "Chennai", contactPhone: "+919876543210", latitude: 13.08, longitude: 80.27 })
  await request.validate()
  assert.deepEqual(request.geoLocation.toObject(), { type: "Point", coordinates: [80.27, 13.08] })
})

test("emergency SMS and precise alert location are opt-in by default", () => {
  const user = new User({ role: "INDIVIDUAL", name: "Test", email: "test@example.invalid", phone: "+919876543210", password: "hashed", location: "Chennai" })
  assert.equal(user.emergencySmsOptIn, false)
  assert.equal(user.phoneVerifiedAt, null)
  assert.equal(user.emergencyAlertLocation, undefined)
})

test("offline emergency directory includes the requested national numbers", () => {
  const numbers = new Set(defaultEmergencyContacts.map((contact) => contact.number))
  for (const number of ["112", "100", "101", "108", "102", "1070", "1077", "181", "1098", "1930", "1906"]) assert.ok(numbers.has(number), `missing ${number}`)
})
