import createHttpError from "http-errors";
import {
  myStripe,
  stripeCancelUrl,
  stripeReturnUrl,
  stripeSuccessUrl,
  stripeWebhookSecret,
  subscriptionTrialPeriodDays,
  stripeMonthlyPrice,
  stripeYearlyPrice,
  stripeLifetimePrice,
} from "../../constants/constants.js";
import Subscriber from "../../models/subscriptionModel/subscription.model.js";
import { User } from "../../models/userModel/user.model.js";
import { TryCatch } from "../../utils/tryCatch.js";

const statusMapping: { [key: string]: string } = {
  incomplete: "pending",
  incomplete_expired: "expired",
  trialing: "trial",
  active: "active",
  past_due: "past_due",
  canceled: "canceled",
  unpaid: "unpaid",
};

// http://localhost:8000/api/v1/subscription/create-session  Add New Subscription
// -----------------------------------------------------------------------------

export const createStripeSession = TryCatch(async (req, res, next) => {
  const { _id: userId } = req.user;
  const user = await User.findById(userId);
  if (!user) return next(createHttpError(404, "User Not Found"));
  const { plan } = req.body; // Get the plan from the request body
  if (!plan) return next(createHttpError(400, "Please select a subscription plan"));

  let priceId;
  if (plan === "monthly") {
    priceId = stripeMonthlyPrice;
  } else if (plan === "yearly") {
    priceId = stripeYearlyPrice;
  } else if (plan === "lifetime") {
    priceId = stripeLifetimePrice;
  } else {
    return next(createHttpError(400, "Invalid subscription plan selected"));
  }

  let customer;
  // Check existing customer and retrieve if exist
  const isCustomerExist = await myStripe.customers.list({
    email: user.email,
    limit: 1,
  });
  if (isCustomerExist?.data?.length > 0) {
    customer = isCustomerExist.data[0];
    // Check if any subscription exist for this customer
    const subscription = await myStripe.subscriptions.list({
      customer: customer?.id,
      status: "active",
      limit: 1,
    });
    if (subscription?.data?.length > 0) {
      const stripeSession = await myStripe.billingPortal.sessions.create({
        customer: customer?.id,
        return_url: stripeReturnUrl,
      });
      return res.status(200).json({ success: true, redirect_url: stripeSession.url });
    }
  } else {
    // Create a new customer if it does not exist
    customer = await myStripe.customers.create({
      name: `${user?.firstName} ${user?.lastName}`,
      phone: user?.phoneNumber,
      email: user.email,
      metadata: { userId, plan },
    });
    if (!customer) return next(createHttpError(500, "Error Occurred While Creating Customer"));
  }
  // Now create the Stripe checkout session with the customer ID
  const session = await myStripe.checkout.sessions.create({
    success_url: stripeSuccessUrl,
    cancel_url: stripeCancelUrl,
    payment_method_types: ["card"],
    mode: "subscription",
    billing_address_collection: "auto",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: { userId, plan },
    customer: customer.id,
    subscription_data: {
      trial_period_days: Number(subscriptionTrialPeriodDays) || 7,
    },
  });
  res.status(200).json({ success: true, sessionId: session.id });
});

// http://localhost:8000/api/v1/subscription/subscribe  Add New Subscription
// -------------------------------------------------------------------------

export const addNewSubscription = TryCatch(async (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  const payload = req.body;
  const payloadString = JSON.stringify(payload);

  const header = myStripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret: stripeWebhookSecret,
  });
  if (!signature) return next(createHttpError(400, "Signature Not Found"));
  let event;
  try {
    event = await myStripe.webhooks.constructEvent(payloadString, header, stripeWebhookSecret);
  } catch (err: any) {
    return next(createHttpError(400, `Webhook Error: ${err.message}`));
  }

  const subscription: any = event.data.object;
  const customer: any = await myStripe.customers.retrieve(subscription.customer);

  if (!customer) return next(createHttpError(404, "Customer Not Found"));
  const trialStartDate = subscription.trial_start ? new Date(subscription.trial_start * 1000) : null;
  const trialEndDate = trialStartDate ? new Date(trialStartDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null;

  const subscriptionData = {
    user: customer.metadata.userId,
    plan: customer.metadata?.plan,
    stripeCustomerId: customer.id,
    stripeSubscriptionId: subscription.id,
    paymentMethod: [subscription.default_payment_method],
    priceId: subscription.items?.data[0]?.price?.id,
    subscriptionStatus: statusMapping[subscription.status] || "pending",
    subscriptionStartDate: new Date(subscription.current_period_start * 1000),
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    billingAddress: subscription.billing_details
      ? new Map(Object.entries(subscription.billing_details))
      : new Map(),
    isTrial: trialEndDate && trialEndDate > new Date() ? true : false,
    trialStartDate: trialStartDate,
    trialEndDate: trialEndDate,
  };

  console.log("webhooks", subscriptionData);

  switch (event.type) {
    case "customer.subscription.created":
      const newSubscription = await Subscriber.create(subscriptionData);
      if (!newSubscription) return next(createHttpError(500, "Error Occurred While Creating Subscription"));
      const updateUser = await User.findByIdAndUpdate(customer.metadata.userId, {
        subscriptionId: newSubscription._id,
      });
      if (!updateUser) return next(createHttpError(500, "Error Occurred While Updating User"));
      return res.status(201).json({ success: true, message: "Subscription Created" });

    case "customer.subscription.updated":
      const updateSubscription = await Subscriber.updateOne(
        { stripeSubscriptionId: subscription.id },
        { subscriptionStatus: statusMapping[subscription.status] }
      );
      if (!updateSubscription)
        return next(createHttpError(500, "Error Occurred While Updating Subscription"));
      return res.status(200).json({ success: true, message: "Subscription Updated" });

    case "customer.subscription.deleted":
      const deleteSubscription = await Subscriber.updateOne(
        { stripeSubscriptionId: subscription.id },
        { subscriptionStatus: statusMapping[subscription.status] }
      );
      if (!deleteSubscription)
        return next(createHttpError(500, "Error Occurred While Deleting Subscription"));
      return res.status(200).json({ success: true, message: "Subscription Deleted" });

    case "customer.subscription.paused":
      const pauseSubscription = await Subscriber.updateOne(
        { stripeSubscriptionId: subscription.id },
        { subscriptionStatus: statusMapping[subscription.status] }
      );
      if (!pauseSubscription) {
        return next(createHttpError(500, "Error Occurred While Pausing Subscription"));
      }
      return res.status(200).json({ success: true, message: "Subscription Paused" });

    case "customer.subscription.resumed":
      const resumeSubscription = await Subscriber.updateOne(
        { stripeSubscriptionId: subscription.id },
        { subscriptionStatus: statusMapping[subscription.status] }
      );
      if (!resumeSubscription)
        return next(createHttpError(500, "Error Occurred While Resuming Subscription"));
      return res.status(200).json({ success: true, message: "Subscription Resumed" });

    case "customer.subscription.trial_will_end":
      const endTrialPeriod = await Subscriber.updateOne(
        { stripeSubscriptionId: subscription.id },
        {
          subscriptionStatus: statusMapping[subscription.status],
          trialStartDate: null,
          trialEndDate: null,
          isTrial: false,
        }
      );
      if (!endTrialPeriod) return next(createHttpError(500, "Error Occurred While Resuming Subscription"));
      return res.status(200).json({ success: true, message: "Subscription Resumed" });
    default:
      return res.status(400).json({ success: false, message: "Unhandled Event Type" });
  }
});

// http://localhost:8000/api/v1/subscription/subscribers
// get all subscriber list
export const getAllSubscriber = TryCatch(async (req, res, next) => {
  const subscribers = await Subscriber.find().populate("user");
  res.status(200).json({ success: true, data: subscribers });
});
