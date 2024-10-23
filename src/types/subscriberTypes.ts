import { Types } from "mongoose";

interface SubscriberTypes {
  user: Types.ObjectId;
  plan: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  paymentMethod: string[];
  priceId: string;
  subscriptionStatus: string;
  billingAddress: object;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  trialStartDate: Date;
  trialEndDate: Date;
  isTrial: boolean;
}
export default SubscriberTypes;
