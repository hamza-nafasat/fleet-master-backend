import { Schema, Types, model } from "mongoose";
import { NotificationSchemaTypes } from "../../types/notification.types.js";

const notificationSchema = new Schema<NotificationSchemaTypes>(
  {
    to: { type: Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    truckId: { type: Types.ObjectId, ref: "Truck", required: true },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

const Notification = model("Notification", notificationSchema);

export default Notification;
