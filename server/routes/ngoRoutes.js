import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowVerifiedNgo } from "../middleware/roleMiddleware.js";
import { ngoDashboard } from "../controllers/ngoController.js";

const router = express.Router();
router.use(protect, allowVerifiedNgo);
router.get("/dashboard", ngoDashboard);
export default router;
