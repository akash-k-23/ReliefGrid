import Achievement from "../models/Achievement.js"
import AchievementAudit from "../models/AchievementAudit.js"
import Donation from "../models/Donation.js"
import VolunteerApplication from "../models/VolunteerApplication.js"
import VolunteerOpportunity from "../models/VolunteerOpportunity.js"
import { createNotification } from "./notificationService.js"

const thresholdList = (setting, fallback) => {
  const configured = process.env[setting]?.split(",").map((value) => Number(value.trim()))
  if (configured?.length === fallback.length && configured.every((value, index) => Number.isInteger(value) && value > 0 && (index === 0 || value > configured[index - 1]))) return configured
  return fallback
}

const donationThresholds = thresholdList("ACHIEVEMENT_DONATION_THRESHOLDS", [1, 5, 10, 25, 50])
const volunteerThresholds = thresholdList("ACHIEVEMENT_VOLUNTEER_THRESHOLDS", [1, 5, 10, 25, 50])
const combinedThresholds = thresholdList("ACHIEVEMENT_COMBINED_THRESHOLDS", [1, 5, 15, 30])

export const achievementDefinitions = [
  ...["First Contribution", "Generous Heart", "Helping Hand", "Community Champion", "Relief Hero"].map((name, index) => ({ badgeId: ["first-contribution", "generous-heart", "helping-hand", "community-champion", "relief-hero"][index], category: "DONATION", name, threshold: donationThresholds[index] })),
  ...["First Volunteer", "Active Volunteer", "Dedicated Volunteer", "Community Guardian", "Volunteer Champion"].map((name, index) => ({ badgeId: ["first-volunteer", "active-volunteer", "dedicated-volunteer", "community-guardian", "volunteer-champion"][index], category: "VOLUNTEER", name, threshold: volunteerThresholds[index] })),
  ...["First Responder", "Disaster Supporter", "Community Hero", "Lifeline"].map((name, index) => ({ badgeId: ["first-responder", "disaster-supporter", "community-hero", "lifeline"][index], category: "COMBINED", name, threshold: combinedThresholds[index] })),
]

export function getAchievementProgress({ donations = 0, volunteerActivities = 0 }) {
  const counts = {
    DONATION: donations,
    VOLUNTEER: volunteerActivities,
    COMBINED: donations + volunteerActivities,
  }

  return achievementDefinitions.map((badge) => ({
    ...badge,
    current: counts[badge.category],
    unlocked: counts[badge.category] >= badge.threshold,
    progress: Math.min(100, Math.floor((counts[badge.category] / badge.threshold) * 100)),
  }))
}

export async function syncUserAchievements(userId, performedBy = null) {
  const [donations, demoOpportunityIds, existing] = await Promise.all([
    Donation.find({ donor: userId, status: { $in: ["RECEIVED", "ALLOCATED"] }, isDemoData: { $ne: true } }).sort({ createdAt: 1 }).select("_id"),
    VolunteerOpportunity.distinct("_id", { isDemoData: true }),
    Achievement.find({ user: userId }).select("badgeId"),
  ])
  const volunteerActivities = await VolunteerApplication.find({ volunteer: userId, status: "COMPLETED", opportunity: { $nin: demoOpportunityIds } }).sort({ createdAt: 1 }).select("_id")
  const unlocked = new Set(existing.map((badge) => badge.badgeId))
  const currentCounts = { donations: donations.length, volunteerActivities: volunteerActivities.length }
  const progress = getAchievementProgress(currentCounts)

  for (const badge of progress) {
    if (!badge.unlocked || unlocked.has(badge.badgeId)) continue
    const donationRecords = badge.category === "DONATION" || badge.category === "COMBINED"
      ? donations.slice(0, badge.category === "DONATION" ? badge.threshold : Math.min(badge.threshold, donations.length))
      : []
    const volunteerRecords = badge.category === "VOLUNTEER" || badge.category === "COMBINED"
      ? volunteerActivities.slice(0, badge.category === "VOLUNTEER" ? badge.threshold : Math.max(0, badge.threshold - donationRecords.length))
      : []
    const qualifyingRecords = [
      ...donationRecords.map(({ _id }) => ({ kind: "DONATION", recordId: _id })),
      ...volunteerRecords.map(({ _id }) => ({ kind: "VOLUNTEER", recordId: _id })),
    ]

    try {
      await Achievement.create({
        user: userId,
        badgeId: badge.badgeId,
        qualifyingDonationCount: donationRecords.length,
        qualifyingVolunteerCount: volunteerRecords.length,
        qualifyingRecords,
      })
      await AchievementAudit.create({ user: userId, badgeId: badge.badgeId, action: "UNLOCKED", performedBy, donationCount: donations.length, volunteerCount: volunteerActivities.length })
      await createNotification({ user: userId, type: "ACHIEVEMENT_UNLOCKED", message: `Achievement unlocked: ${badge.name}` })
    } catch (error) {
      if (error.code !== 11000) throw error
    }
  }

  if (performedBy) {
    await AchievementAudit.insertMany(progress.map((badge) => ({
      user: userId,
      badgeId: badge.badgeId,
      action: "RECALCULATED",
      performedBy,
      donationCount: donations.length,
      volunteerCount: volunteerActivities.length,
    })))
  }

  return { progress, currentCounts, unlockedAt: await Achievement.find({ user: userId }).select("badgeId unlockedAt") }
}
