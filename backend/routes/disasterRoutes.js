import express from "express";
import { liveDisasterFeed } from "../services/disasterFeedService.js";

const router = express.Router();

router.get("/live", (req, res) => {
  res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  res.json({ success: true, data: liveDisasterFeed.getSnapshot() });
});

export default router;