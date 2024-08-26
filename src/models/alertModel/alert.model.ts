import { Schema, model } from "mongoose";
import { AlertSchemaTypes } from "../../types/alert.types.js";

const alertSchema = new Schema<AlertSchemaTypes>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    severity: { type: String, required: true },
    status: { type: String, required: true },
    platform: { type: String, required: true },
  },
  { timestamps: true }
);

export const Alert = model<AlertSchemaTypes>("Alert", alertSchema);
