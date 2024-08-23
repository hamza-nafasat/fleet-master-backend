import { Schema, Types, model } from "mongoose";
import { NotificationSchemaTypes } from "../../types/notification.types.js";

// export const notificationTypes = [
//     "inFence",
//     "outFence",
//     "sdCardRemoved",
//     "sdCardInserted",
//     "geoFenceCreated",
//     "geoFenceRemoved",
// ];

const notificationSchema = new Schema<NotificationSchemaTypes>(
    {
        to: { type: Types.ObjectId, ref: "User", required: true },
        type: { type: String, required: true },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

const Notification = model("Notification", notificationSchema);

export default Notification;
