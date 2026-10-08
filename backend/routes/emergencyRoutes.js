import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getEmergencyPreferences,
  updateEmergencyPreferences,
  sendPhoneVerification,
  verifyPhone,
  listMyAlerts,
  respondToAlert,
  listEmergencyContacts,
  nearbyHelp,
  handleTwilioCallback,
  handleGatewayCallback,
  createAbuseReport,
} from "../controllers/emergencyController.js";

const router = express.Router();
router.get("/contacts", listEmergencyContacts);
router.post("/twilio/callback", handleTwilioCallback);
router.post("/gateway/callback", handleGatewayCallback);
router.use(protect);
router.get("/preferences", getEmergencyPreferences);
router.post("/reports", createAbuseReport);
router.patch("/preferences", updateEmergencyPreferences);
router.post("/phone-verification", sendPhoneVerification);
router.post("/phone-verification/confirm", verifyPhone);
router.get("/alerts", listMyAlerts);
router.post("/requests/:requestId/respond", respondToAlert);
router.get("/nearby", nearbyHelp);
export default router;
