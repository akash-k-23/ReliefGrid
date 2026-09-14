import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { adminSummary, listUsers, updateUserStatus, listAdminRequests, listAdminApplications } from "../controllers/adminController.js";

const router = express.Router();
router.use(protect, allowRoles("ADMIN"));
router.get("/summary", adminSummary);
router.get("/users", listUsers);
router.patch("/users/:id/status", updateUserStatus);
router.get("/requests", listAdminRequests);
router.get("/applications", listAdminApplications);
export default router;
