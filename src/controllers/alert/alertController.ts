import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { Alert } from "../../models/alertModel/alert.model.js";
import { AlertTypes } from "../../types/alert.types.js";
import { TryCatch } from "../../utils/tryCatch.js";

// create alert
// -------------
const createAlert = TryCatch(async (req: Request<{}, {}, AlertTypes>, res: Response, next: NextFunction) => {
  const ownerId = req.user?._id;
  const { platform, severity, type, status } = req.body;
  if (!platform || !severity || !type || !status) {
    return next(createHttpError.BadRequest("All fields are required"));
  }
  const alert = await Alert.create({ platform, severity, type, status, ownerId });
  res.status(201).json({ success: true, message: "Alert Created Successfully" });
});

// get single device
// -----------------

export { createAlert };
