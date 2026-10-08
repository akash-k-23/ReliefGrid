import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { seedDemoData } from "./config/seedDemoData.js";
import { liveDisasterFeed } from "./services/disasterFeedService.js";
import { startEmergencyAlertWorker } from "./services/emergencyAlertService.js";
import { seedEmergencyContacts } from "./services/emergencyContactService.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedDemoData();
    await seedEmergencyContacts();
    liveDisasterFeed.start();
    await startEmergencyAlertWorker();
    app.listen(PORT, () => {
      console.log(`ReliefGrid backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
