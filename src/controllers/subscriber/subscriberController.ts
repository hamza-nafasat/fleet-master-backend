import createHttpError from "http-errors";
import {
  myStripe,
  stripeCancelUrl,
  stripeLifetimePrice,
  stripeMonthlyPrice,
  stripeReturnUrl,
  stripeSuccessUrl,
  stripeWebhookSecret,
  stripeYearlyPrice,
  subscriptionTrialPeriodDays,
} from "../../constants/constants.js";
import Subscriber from "../../models/subscriptionModel/subscription.model.js";
import { User } from "../../models/userModel/user.model.js";
import { TryCatch } from "../../utils/tryCatch.js";

// http://localhost:8000/api/v1/subscription/create-session  Add New Subscription
// -----------------------------------------------------------------------------

export const createStripeSession = TryCatch(async (req, res, next) => {
  const { _id: userId } = req.user;
  const user = await User.findById(userId);
  if (!user) return next(createHttpError(404, "User Not Found"));
  const { plan } = req.body;
  if (!plan || !["monthly", "yearly", "lifetime"].includes(plan))
    return next(createHttpError(400, "Please select a subscription plan"));

  let priceId;
  let subscriptionMode: any = "subscription";
  if (plan === "monthly") {
    priceId = stripeMonthlyPrice;
  } else if (plan === "yearly") {
    priceId = stripeYearlyPrice;
  } else if (plan === "lifetime") {
    priceId = stripeLifetimePrice;
    subscriptionMode = "payment";
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
    console.log("subscription", subscription);
    if (subscription?.data?.length > 0) {
      const stripeSession = await myStripe.billingPortal.sessions.create({
        customer: customer?.id,
        return_url: stripeReturnUrl,
      });
      console.log("stripeSession", stripeSession);
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
    mode: subscriptionMode,
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

  let event: any;
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
  const priceId = subscription.items?.data[0]?.price?.id;
  const plan =
    priceId === stripeMonthlyPrice
      ? "monthly"
      : priceId === stripeYearlyPrice
      ? "yearly"
      : priceId === stripeLifetimePrice
      ? "lifetime"
      : null;

  const subscriptionData = {
    user: customer.metadata.userId,
    plan,
    stripeCustomerId: customer.id,
    stripeSubscriptionId: subscription.id,
    paymentMethod: [subscription.default_payment_method],
    priceId: priceId,
    subscriptionStatus: subscription.status,
    subscriptionStartDate: new Date(subscription.current_period_start * 1000),
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    billingAddress: subscription.billing_details
      ? new Map(Object.entries(subscription.billing_details))
      : new Map(),
    isTrial: subscription.status === "trial" ? true : false,
    trialStartDate,
    trialEndDate,
  };

  // Event handlers for subscriptions
  const eventHandlers: any = {
    "customer.subscription.created": async () => {
      const newSubscription = await Subscriber.create(subscriptionData);
      if (!newSubscription) throw createHttpError(500, "Error Creating Subscription");

      const updatedUser = await User.findByIdAndUpdate(customer.metadata.userId, {
        subscriptionId: newSubscription._id,
      });
      if (!updatedUser) throw createHttpError(500, "Error Updating User");

      return { message: "Subscription Created" };
    },
    "customer.subscription.updated": async () => {
      await Subscriber.updateOne(
        { stripeSubscriptionId: subscription.id },
        { subscriptionStatus: subscription.status }
      );
      return { message: "Subscription Updated" };
    },
    "customer.subscription.deleted": async () => {
      await Promise.all([
        Subscriber.deleteOne({ stripeSubscriptionId: subscription.id }),
        User.findByIdAndUpdate(customer.metadata.userId, { subscriptionId: null }),
      ]);
      return { message: "Subscription Deleted" };
    },
    "customer.subscription.paused": async () => {
      await Subscriber.updateOne(
        { stripeSubscriptionId: subscription.id },
        { subscriptionStatus: subscription.status }
      );
      return { message: "Subscription Paused" };
    },
    "customer.subscription.resumed": async () => {
      await Subscriber.updateOne(
        { stripeSubscriptionId: subscription.id },
        { subscriptionStatus: subscription.status }
      );
      return { message: "Subscription Resumed" };
    },
    "customer.subscription.trial_will_end": async () => {
      await Subscriber.updateOne(
        { stripeSubscriptionId: subscription.id },
        {
          subscriptionStatus: subscription.status,
          trialStartDate: null,
          trialEndDate: null,
          isTrial: false,
        }
      );
      return { message: "Trial Ended, Subscription Resumed" };
    },
  };

  const handler = eventHandlers[event.type];
  if (handler) {
    try {
      const result = await handler();
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      return next(err);
    }
  }

  return res.status(400).json({ success: false, message: "Unhandled Event Type" });
});

// http://localhost:8000/api/v1/subscription/cancel  cancel New Subscription
// -------------------------------------------------------------------------

export const cancelSubscription = TryCatch(async (req, res, next) => {
  const { subscriptionId } = req.query;
  const { cancelAtPeriodEnd = true } = req.body;

  const subscription = await Subscriber.findOne({ stripeSubscriptionId: subscriptionId });
  if (!subscription) return next(createHttpError(404, "Subscription not found"));

  try {
    let stripeSubscription;
    if (cancelAtPeriodEnd) {
      stripeSubscription = await myStripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      subscription.subscriptionStatus = "scheduled_for_cancellation";
    } else {
      stripeSubscription = await myStripe.subscriptions.cancel(subscriptionId);
      subscription.subscriptionStatus = "canceled";
    }

    const updatedSubscription = await subscription.save();
    if (!updatedSubscription) {
      return next(createHttpError(500, "Error updating subscription status"));
    }

    return res.status(200).json({
      success: true,
      message: cancelAtPeriodEnd
        ? "Subscription cancellation scheduled at the end of the current billing period"
        : "Subscription canceled immediately",
      subscriptionStatus: subscription.subscriptionStatus,
    });
  } catch (err: any) {
    return next(createHttpError(500, `Stripe Error: ${err.message}`));
  }
});

// http://localhost:8000/api/v1/subscription/subscribers
// get all subscriber list
export const getAllSubscriber = TryCatch(async (req, res, next) => {
  const subscribers = await Subscriber.find().populate("user");
  res.status(200).json({ success: true, data: subscribers });
});
