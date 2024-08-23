import { Schema, model } from "mongoose";
import { DeviceSchemaTypes } from "../../types/device.types.js";

const deviceSchema = new Schema<DeviceSchemaTypes>(
    {
        ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        ip: { type: String, required: true },
        uniqueId: { type: String, required: true, unique: true },
        name: { type: String, required: true, unique: true },
        type: { type: String, required: true },
        assignedTo: { type: Schema.Types.ObjectId, ref: "Truck", default: null },
    },
    { timestamps: true }
);

export const Device = model<DeviceSchemaTypes>("Device", deviceSchema);
