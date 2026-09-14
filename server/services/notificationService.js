import Notification from "../models/Notification.js";

export const createNotification = async ({ user, type, message }) => {
  if (!user) return;
  await Notification.create({ user, type, message });
};
