import { model, Schema, Types } from "mongoose";

const reportsSchema = new Schema(
  {
    ownerId: { type: Types.ObjectId, ref: "User", required: true },
    truck: { type: Schema.Types.ObjectId, ref: "Truck", required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    speed: { type: Number },
  },
  { timestamps: true }
);

export const Report = model("Report", reportsSchema);
