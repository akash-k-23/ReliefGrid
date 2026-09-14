import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowVerifiedNgo } from "../middleware/roleMiddleware.js";
import { listOpportunities, getOpportunity, createOpportunity, joinOpportunity, leaveOpportunity, updateOpportunity, applyToOpportunity, listMyApplications, updateApplication } from "../controllers/volunteerController.js";

const router = express.Router();
router.use(protect);
router.get("/", listOpportunities);
router.get("/applications/my", listMyApplications);
router.get("/:id", getOpportunity);
router.post("/:id/apply", applyToOpportunity);
router.patch("/applications/:id", updateApplication);
router.post("/", (req, res, next) => req.user.role === "ADMIN" ? next() : allowVerifiedNgo(req, res, next), createOpportunity);
router.post("/:id/join", joinOpportunity);
router.post("/:id/leave", leaveOpportunity);
router.patch("/:id", updateOpportunity);
export default router;
