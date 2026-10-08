import Donation from "../models/Donation.js"
import VolunteerApplication from "../models/VolunteerApplication.js"
import AchievementAudit from "../models/AchievementAudit.js"
import VolunteerOpportunity from "../models/VolunteerOpportunity.js"
import User from "../models/User.js"
import { achievementDefinitions, syncUserAchievements } from "../services/achievementService.js"

const verifiedDonations = (userId) => ({ donor: userId, status: { $in: ["RECEIVED", "ALLOCATED"] }, isDemoData: { $ne: true } })

export const getMyImpact = async (req, res) => {
  const userId = req.user._id
  const demoOpportunityIds = await VolunteerOpportunity.distinct("_id", { isDemoData: true })
  const [donationStats, donationBreakdown, completedVolunteerActivities, verifiedVolunteerHours, activeDonations, activeVolunteerActivities, supportedDonationRequests, completedRequestActivities] = await Promise.all([
    Donation.aggregate([
      { $match: verifiedDonations(userId) },
      { $group: { _id: null, count: { $sum: 1 }, recordedCashAmount: { $sum: { $cond: [{ $eq: ["$donationType", "MONEY"] }, "$amount", 0] } } } },
    ]),
    Donation.aggregate([
      { $match: verifiedDonations(userId) },
      { $group: { _id: "$donationType", count: { $sum: 1 } } },
    ]),
    VolunteerApplication.countDocuments({ volunteer: userId, status: "COMPLETED", opportunity: { $nin: demoOpportunityIds } }),
    VolunteerApplication.aggregate([
      { $match: { volunteer: userId, status: "COMPLETED", hoursVerifiedAt: { $ne: null }, opportunity: { $nin: demoOpportunityIds } } },
      { $group: { _id: null, hours: { $sum: "$verifiedHours" } } },
    ]),
    Donation.countDocuments({ donor: userId, status: "PLEDGED", isDemoData: { $ne: true } }),
    VolunteerApplication.countDocuments({ volunteer: userId, status: { $in: ["PENDING", "APPROVED"] }, opportunity: { $nin: demoOpportunityIds } }),
    Donation.distinct("request", { ...verifiedDonations(userId), request: { $ne: null } }),
    VolunteerApplication.find({ volunteer: userId, status: "COMPLETED", opportunity: { $nin: demoOpportunityIds } }).populate("opportunity", "sourceRequest").select("opportunity").lean(),
  ])
  const donationCount = donationStats[0]?.count || 0
  const volunteerHours = verifiedVolunteerHours[0]?.hours || 0
  const supportedRequestIds = new Set(supportedDonationRequests.filter(Boolean).map((id) => id.toString()))
  completedRequestActivities.forEach((activity) => {
    const requestId = activity.opportunity?.sourceRequest
    if (requestId) supportedRequestIds.add(requestId.toString())
  })
  const badges = await syncUserAchievements(userId)
  const stats = {
    verifiedDonations: donationCount,
    recordedCashAmount: donationStats[0]?.recordedCashAmount || 0,
    verifiedDonationBreakdown: Object.fromEntries(donationBreakdown.map((item) => [item._id, item.count])),
    completedVolunteerActivities,
    verifiedVolunteerHours: volunteerHours,
    helpRequestsSupported: supportedRequestIds.size,
    peopleReached: null,
    activeContributions: activeDonations + activeVolunteerActivities,
  }
  const summary = [
    `${stats.verifiedDonations} verified donation${stats.verifiedDonations === 1 ? "" : "s"}`,
    `${stats.completedVolunteerActivities} completed volunteer activit${stats.completedVolunteerActivities === 1 ? "y" : "ies"}`,
    `${stats.helpRequestsSupported} distinct help request${stats.helpRequestsSupported === 1 ? "" : "s"} supported`,
  ].join(" · ")

  res.json({ success: true, data: { stats, summary, achievements: badges.progress.map((badge) => ({ ...badge, unlockedAt: badges.unlockedAt.find((item) => item.badgeId === badge.badgeId)?.unlockedAt || null })) } })
}

export const listMyContributions = async (req, res) => {
  const page = Math.min(100, Math.max(1, Number.parseInt(req.query.page, 10) || 1))
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 15))
  const type = req.query.type || "all"
  if (!["all", "donation", "volunteer"].includes(type)) return res.status(400).json({ success: false, message: "Invalid contribution filter" })

  const donationQuery = type === "volunteer" ? null : Donation.find({ donor: req.user._id, isDemoData: { $ne: true } })
    .populate("request", "title status")
    .select("donationType item quantity amount status request createdAt")
    .lean()
  const demoOpportunityIds = type === "donation" ? [] : await VolunteerOpportunity.distinct("_id", { isDemoData: true })
  const volunteerQuery = type === "donation" ? null : VolunteerApplication.find({ volunteer: req.user._id, opportunity: { $nin: demoOpportunityIds } })
    .populate("opportunity", "title location status")
    .select("status verifiedHours hoursVerifiedAt opportunity createdAt")
    .lean()
  const fetchCount = (page - 1) * limit + limit
  const [donations, volunteerActivities, donationTotal, volunteerTotal] = await Promise.all([
    donationQuery ? donationQuery.sort({ createdAt: -1 }).limit(fetchCount) : Promise.resolve([]),
    volunteerQuery ? volunteerQuery.sort({ createdAt: -1 }).limit(fetchCount) : Promise.resolve([]),
    type === "volunteer" ? Promise.resolve(0) : Donation.countDocuments({ donor: req.user._id, isDemoData: { $ne: true } }),
    type === "donation" ? Promise.resolve(0) : VolunteerApplication.countDocuments({ volunteer: req.user._id, opportunity: { $nin: demoOpportunityIds } }),
  ])
  const entries = [
    ...donations.map((item) => ({ id: `donation-${item._id}`, kind: "DONATION", title: item.item, detail: item.request?.title || item.donationType, status: item.status, quantity: item.quantity, amount: item.amount, createdAt: item.createdAt })),
    ...volunteerActivities.map((item) => ({ id: `volunteer-${item._id}`, kind: "VOLUNTEER", title: item.opportunity?.title || "Volunteer activity", detail: item.opportunity?.location || "", status: item.status, verifiedHours: item.hoursVerifiedAt ? item.verifiedHours : null, createdAt: item.createdAt })),
  ].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
  const start = (page - 1) * limit

  const total = donationTotal + volunteerTotal
  res.json({ success: true, data: { items: entries.slice(start, start + limit), page, limit, total, hasMore: start + limit < total } })
}

export const listMyAchievements = async (req, res) => {
  const result = await syncUserAchievements(req.user._id)
  const audit = await AchievementAudit.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).select("badgeId action createdAt donationCount volunteerCount")
  res.json({
    success: true,
    data: {
      badges: result.progress.map((badge) => ({ ...badge, unlockedAt: result.unlockedAt.find((item) => item.badgeId === badge.badgeId)?.unlockedAt || null })),
      audit,
      badgeCount: achievementDefinitions.length,
    },
  })
}

export const getImpactLeaderboard = async (_req, res) => {
  const demoOpportunityIds = await VolunteerOpportunity.distinct("_id", { isDemoData: true })
  const [donationCounts, volunteerCounts] = await Promise.all([
    Donation.aggregate([
      { $match: { status: { $in: ["RECEIVED", "ALLOCATED"] }, isDemoData: { $ne: true } } },
      { $group: { _id: "$donor", count: { $sum: 1 } } },
    ]),
    VolunteerApplication.aggregate([
      { $match: { status: "COMPLETED", opportunity: { $nin: demoOpportunityIds } } },
      { $group: { _id: "$volunteer", count: { $sum: 1 } } },
    ]),
  ])

  const rankings = new Map()
  for (const { _id, count } of donationCounts) rankings.set(_id.toString(), { userId: _id, verifiedDonations: count, completedActivities: 0 })
  for (const { _id, count } of volunteerCounts) {
    const key = _id.toString()
    const entry = rankings.get(key) || { userId: _id, verifiedDonations: 0, completedActivities: 0 }
    entry.completedActivities = count
    rankings.set(key, entry)
  }

  const entries = [...rankings.values()]
  const users = await User.find({ _id: { $in: entries.map((entry) => entry.userId) } }).select("name organizationName role").lean()
  const userById = new Map(users.map((user) => [user._id.toString(), user]))
  const leaderboard = entries
    .map((entry) => ({
      name: userById.get(entry.userId.toString())?.name || userById.get(entry.userId.toString())?.organizationName || "ReliefGrid contributor",
      role: userById.get(entry.userId.toString())?.role || "INDIVIDUAL",
      verifiedDonations: entry.verifiedDonations,
      completedActivities: entry.completedActivities,
      contributionCount: entry.verifiedDonations + entry.completedActivities,
    }))
    .sort((first, second) => second.contributionCount - first.contributionCount || second.verifiedDonations - first.verifiedDonations || first.name.localeCompare(second.name))
    .slice(0, 10)
    .map((entry, index) => ({ rank: index + 1, ...entry }))

  res.json({
    success: true,
    data: {
      leaderboard,
      totals: {
        verifiedDonations: donationCounts.reduce((sum, entry) => sum + entry.count, 0),
        completedActivities: volunteerCounts.reduce((sum, entry) => sum + entry.count, 0),
        contributors: entries.length,
      },
    },
  })
}
