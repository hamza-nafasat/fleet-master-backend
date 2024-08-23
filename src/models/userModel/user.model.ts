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
        isVerified: { type: Boolean, default: false },
        subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscriber" },
    },
    { timestamps: true }
);

export const User = mongoose.model<UserSchemaTypes>("User", userSchema);
