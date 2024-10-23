import { Schema, Types, model } from "mongoose";
import { EmploySchemaTypes } from "../../types/employTypes.js";

const imageSchema = new Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
});

const employSchema = new Schema<EmploySchemaTypes>(
  {
    ownerId: { type: Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
    image: { type: imageSchema, required: true },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Employ = model<EmploySchemaTypes>("Employ", employSchema);
