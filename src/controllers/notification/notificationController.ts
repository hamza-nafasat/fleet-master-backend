import { Request } from "express";
import createHttpError from "http-errors";
import { isValidObjectId } from "mongoose";
import Notification from "../../models/notificationModel/notification.model.js";
import { TryCatch } from "../../utils/tryCatch.js";
import { NotificationBodyTypes } from "../../types/notification.types.js";

const createNotification = TryCatch(async (req: Request<{}, {}, NotificationBodyTypes>, res, next) => {
  const { to, type, message } = req.body;
  if (!to || !type || !message) return next(createHttpError(400, "All Required fields are Not Provided!"));
  const notification = await Notification.create({ to, type, message });
  if (!notification) return next(createHttpError(404, "Error While Creating Notification"));
  res.status(201).json({ success: true, message: "Notification Created Successfully" });
});

const getMyAllPresentNotifications = TryCatch(async (req: Request, res, next) => {
  const ownerId = req.user?._id;
  const notifications = await Notification.find({ to: ownerId, isRead: false }).sort({
    createdAt: -1,
  });
  if (!notifications) return next(createHttpError(404, "No Notifications Found"));
  res.status(200).json({ success: true, notifications });
});

const getMyAllNotification = TryCatch(async (req: Request, res, next) => {
  const ownerId = req.user?._id;
  // console.log("i am called and this is ownerId", ownerId);
  const notifications = await Notification.find({ to: ownerId }).sort({ isRead: 1, createdAt: -1 });
  if (!notifications) return next(createHttpError(404, "No Notifications Found"));
  // console.log("i am called and this is notifications", notifications);
  res.status(200).json({ success: true, notifications });
});

const getSingleNotification = TryCatch(async (req: Request, res, next) => {
  const ownerId = req.user?._id;
  const notificationId = req?.params?.notificationId;
  if (!isValidObjectId(notificationId)) return next(createHttpError(400, "Invalid Notification Id"));
  const notification = await Notification.findOne({ _id: notificationId, to: ownerId });
  if (!notification) return next(createHttpError(404, "Notification Not Found"));
  res.status(200).json({ success: true, notification });
});

const deleteSingleNotification = TryCatch(async (req: Request, res, next) => {
  const ownerId = req.user?._id;
  const notificationId = req?.params?.notificationId;
  if (!isValidObjectId(notificationId)) return next(createHttpError(400, "Invalid Notification Id"));
  const notification = await Notification.findOneAndDelete({ _id: notificationId, to: ownerId });
  if (!notification) return next(createHttpError(404, "Notification Not Found"));
  res.status(200).json({ success: true, message: "Notification Deleted Successfully" });
});

const readTheNotification = TryCatch(async (req: Request, res, next) => {
  const ownerId = req.user?._id;
  const notificationId = req?.params?.notificationId;
  if (!isValidObjectId(notificationId)) return next(createHttpError(400, "Invalid Notification Id"));
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, to: ownerId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) return next(createHttpError(404, "Notification Not Found"));
  res.status(200).json({ success: true, notification });
});

const readAllNotifications = TryCatch(async (req: Request, res, next) => {
  const ownerId = req.user?._id;
  const notifications = await Notification.updateMany(
    { to: ownerId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  if (!notifications) return next(createHttpError(404, "No Notifications Found"));
  res.status(200).json({ success: true, message: "All Notifications Read Successfully" });
});

export {
  createNotification,
  getMyAllPresentNotifications,
  getSingleNotification,
  deleteSingleNotification,
  readTheNotification,
  getMyAllNotification,
  readAllNotifications,
};
