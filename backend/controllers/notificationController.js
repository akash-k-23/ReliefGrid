import Notification from "../models/Notification.js";

export const listNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  const unread = await Notification.countDocuments({ user: req.user._id, readAt: null });
  res.json({ success: true, data: notifications, unread });
};

export const markNotificationRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { readAt: new Date() }, { new: true });
  if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
  res.json({ success: true, data: notification });
};

export const markAllNotificationsRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, readAt: null }, { readAt: new Date() });
  res.json({ success: true, message: "Notifications marked as read" });
};

export const deleteNotification = async (req, res) => {
  const deleted = await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!deleted.deletedCount) return res.status(404).json({ success: false, message: "Notification not found" });
  res.json({ success: true, message: "Notification deleted" });
};
