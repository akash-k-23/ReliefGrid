import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMe, updateMe, changePassword } from "../controllers/userController.js";

const router = express.Router();
router.use(protect);
router.get("/me", getMe);
router.patch("/me", updateMe);
router.patch("/me/password", changePassword);
export default router;
