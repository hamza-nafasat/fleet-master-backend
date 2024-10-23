import mongoose from "mongoose";
import { UserSchemaTypes } from "../../types/userTypes.js";

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
});

const userSchema = new mongoose.Schema<UserSchemaTypes>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    image: { type: imageSchema, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    interval: { type: Number, default: 30 },
    isVerified: { type: Boolean, default: false },
    isCustomDb: { type: Boolean, default: false },
    customDbHost: { type: String, default: null },
    customDbPassword: { type: String, default: null },
    customDbUsername: { type: String, default: null },
    customDbName: { type: String, default: null },
    customDbPort: { type: Number, default: null },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscriber" },
  },
  { timestamps: true }
);

export const User = mongoose.model<UserSchemaTypes>("User", userSchema);
