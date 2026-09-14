import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowVerifiedNgo } from "../middleware/roleMiddleware.js";
import { createDonation, listMyDonations, listDonations, cancelDonation } from "../controllers/donationController.js";

const router = express.Router();
router.use(protect);
router.post("/", createDonation);
router.get("/my", listMyDonations);
router.patch("/:id/cancel", cancelDonation);
router.get("/", (req, res, next) => req.user.role === "ADMIN" ? next() : allowVerifiedNgo(req, res, next), listDonations);
export default router;
