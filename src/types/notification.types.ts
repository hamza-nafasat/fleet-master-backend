import { Types } from "mongoose";

interface NotificationSchemaTypes {
    to: Types.ObjectId | null;
    type: string;
    message: string;
    isRead: boolean;
    readAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

interface NotificationBodyTypes {
    to: Types.ObjectId | null;
    type: string;
    message: string;
}
export { NotificationSchemaTypes, NotificationBodyTypes };
