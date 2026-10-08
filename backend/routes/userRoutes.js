import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMe, updateMe, changePassword } from "../controllers/userController.js";
import { getMyImpact, listMyContributions, listMyAchievements, getImpactLeaderboard } from "../controllers/impactController.js";

const router = express.Router();
router.use(protect);
router.get("/me", getMe);
router.get("/me/impact", getMyImpact);
router.get("/me/contributions", listMyContributions);
router.get("/me/achievements", listMyAchievements);
router.get("/impact-leaderboard", getImpactLeaderboard);
router.patch("/me", updateMe);
router.patch("/me/password", changePassword);
export default router;
