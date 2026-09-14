import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createRequest, listRequests, listPublicRequests, listMyRequests, getRequest, updateRequest, updateRequestStatus, deleteRequest } from "../controllers/requestController.js";

const router = express.Router();
router.use(protect);
router.post("/", createRequest);
router.get("/public", listPublicRequests);
router.get("/my", listMyRequests);
router.get("/", listRequests);
router.get("/:id", getRequest);
router.patch("/:id", updateRequest);
router.patch("/:id/status", updateRequestStatus);
router.delete("/:id", deleteRequest);
export default router;
