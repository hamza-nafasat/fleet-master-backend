import { model, Schema, Types } from "mongoose";
import { truckStatusEnum } from "../../constants/costants.js";
import { SchemaTruckTypes } from "../../types/truckTypes.js";

const imageSchema = new Schema({
    url: { type: String, required: true },
    public_id: { type: String, required: true },
});

const truckSchema = new Schema<SchemaTruckTypes>(
    {
        ownerId: { type: String, required: true },
        truckName: { type: String, required: true },
        fleetNumber: { type: Number, required: true },
        plateNumber: { type: Number, required: true },
        devices: { type: [Schema.Types.ObjectId], ref: "Device", default: [] },
        image: { type: imageSchema, required: true },
        latitude: { type: Number },
        longitude: { type: Number },
        status: { type: String, enum: truckStatusEnum, default: "not-connected" },
        assignedTo: { type: Types.ObjectId, ref: "Driver" },
    },
    { timestamps: true }
);

export const Truck = model<SchemaTruckTypes>("Truck", truckSchema);
