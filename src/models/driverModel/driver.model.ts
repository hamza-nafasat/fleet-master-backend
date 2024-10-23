import { model, Schema, Types } from "mongoose";
import { SchemaDriverTypes } from "../../types/driverTypes.js";

const imageSchema = new Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
});

const driverSchema = new Schema<SchemaDriverTypes>(
  {
    ownerId: { type: Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    licenseExpiry: { type: Date, required: true },
    fleetNumber: { type: Number, required: true },
    image: { type: imageSchema, required: true },
    phoneNumber: { type: String, required: true },
    assignedTruck: { type: Types.ObjectId, ref: "Truck" },
  },
  { timestamps: true }
);

export const Driver = model<SchemaDriverTypes>("Driver", driverSchema);
