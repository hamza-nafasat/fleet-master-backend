import { Schema, model } from "mongoose";
import SubscriberTypes from "../../types/subscriberTypes.js";

const subscriptionSchema = new Schema<SubscriberTypes>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        stripeCustomerId: { type: String, unique: true, required: true },
        stripeSubscriptionId: { type: String, required: true },
        paymentMethod: { type: [String] },
        priceId: { type: String, required: true },
        subscriptionStatus: {
            type: String,
            enum: ["pending", "expired", "trial", "active", "past_due", "canceled", "unpaid"],
            required: true,
        },
        billingAddress: { type: Map, of: String, required: true },
        subscriptionStartDate: { type: Date, default: Date.now, required: true },
        subscriptionEndDate: { type: Date, required: true },
        trialStartDate: { type: Date },
        trialEndDate: { type: Date },
    },
    { timestamps: true }
);

subscriptionSchema.index({ user: 1, stripeCustomerId: 1 });

const Subscriber = model("Subscriber", subscriptionSchema);

export default Subscriber;
