import { model, Schema, Types } from "mongoose";
import { truckStatusEnum } from "../../constants/constants.js";
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
    plateNumber: { type: String, required: true, unique: true },
    devices: { type: [Schema.Types.ObjectId], ref: "Device", default: [] },
    image: { type: imageSchema, required: true },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    status: { type: String, enum: truckStatusEnum, default: "not-connected" },
    assignedTo: { type: Types.ObjectId, ref: "Driver" },
  },
  { timestamps: true }
);

export const Truck = model<SchemaTruckTypes>("Truck", truckSchema);
