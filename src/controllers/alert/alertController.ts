import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { Alert } from "../../models/alertModel/alert.model.js";
import { AlertTypes } from "../../types/alert.types.js";
import { TryCatch } from "../../utils/tryCatch.js";
import { isValidObjectId } from "mongoose";
import { clientNotificationsSelection } from "../../constants/socketState.js";
import { getNewAlertsForUserAndSaveInState } from "../../utils/feature.js";

// create alert
// -------------
const createAlert = TryCatch(
  async (req: Request<{}, {}, AlertTypes>, res: Response, next: NextFunction) => {
    const ownerId = req.user?._id;
    const { platform, severity, type } = req.body;
    if (!platform || !severity || !type) return next(createHttpError.BadRequest("All fields are required"));
    const isExist = await Alert.findOne({ platform, severity, type, ownerId });
    if (isExist) return next(createHttpError.BadRequest("Alert already exists"));
    const alert = await Alert.create({ platform, severity, type, ownerId });
    if (!alert) return next(createHttpError.BadRequest("Alert not created"));

    // add this in client clientNotificationsSelection
    console.log("before", clientNotificationsSelection);
    await getNewAlertsForUserAndSaveInState(ownerId);
    console.log("after", clientNotificationsSelection);
    res.status(201).json({ success: true, message: "Alert Created Successfully" });
  }
);

// get all alerts
// -----------------
const getAllAlerts = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const ownerId = req.user?._id;
  if (!ownerId) return next(createHttpError(400, "Please Login to create a Driver"));
  const alerts = await Alert.find({ ownerId });
  if (!alerts) return next(createHttpError(400, "No Alerts Found"));
  console.log("alerts", alerts);
  res.status(200).json({ success: true, data: alerts });
});

// update alert
// -------------
const updateAlert = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const ownerId = req.user?._id;
  const { alertId } = req.params;
  if (!isValidObjectId(alertId)) return next(createHttpError.BadRequest("Invalid Alert Id"));
  const { platform, severity, type, status } = req.body;
  if (!platform && !severity && !type && !status) {
    return next(createHttpError.BadRequest("Please provide at least one field to update"));
  }
  const alert = await Alert.findOne({ _id: alertId, ownerId });
  if (!alert) return next(createHttpError.NotFound("Alert not found"));

  if (platform) alert.platform = platform;
  if (severity) alert.severity = severity;
  if (type) alert.type = type;
  if (status) alert.status = status;
  await alert.save();

  // add this in client clientNotificationsSelection
  console.log("before", clientNotificationsSelection);
  await getNewAlertsForUserAndSaveInState(ownerId);
  console.log("after", clientNotificationsSelection);

  res.status(200).json({ success: true, message: "Alert Updated Successfully" });
});

// delete alert
// -------------
const deleteAlert = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const ownerId = req.user?._id;
  const { alertId } = req.params;
  if (!isValidObjectId(alertId)) return next(createHttpError.BadRequest("Invalid Alert Id"));
  const alert = await Alert.findOneAndDelete({ _id: alertId, ownerId }, { new: true });
  if (!alert) return next(createHttpError.NotFound("Alert not found"));

  // add this in client clientNotificationsSelection
  console.log("before", clientNotificationsSelection);
  await getNewAlertsForUserAndSaveInState(ownerId);
  console.log("after", clientNotificationsSelection);

  res.status(200).json({ success: true, message: "Alert Deleted Successfully" });
});

export { createAlert, getAllAlerts, updateAlert, deleteAlert };
