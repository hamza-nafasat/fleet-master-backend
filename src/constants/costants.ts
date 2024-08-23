import { CookieOptions } from "express";
import path from "path";
import Stripe from "stripe";
import { fileURLToPath } from "url";
import { config } from "../config/config.js";

export const __dirName = fileURLToPath(import.meta.url);
export const __fileName = path.dirname(__dirName);

export const truckStatusEnum = ["not-connected", "connected"];

export const accessTokenOptions: CookieOptions = {
    httpOnly: true,
    sameSite: config.getEnv("NODE_ENV") !== "development" ? "none" : "lax",
    secure: config.getEnv("NODE_ENV") !== "development",
    maxAge: parseInt(config.getEnv("ACCESS_TOKEN_MAX_AGE")),
};

export const refreshTokenOptions: CookieOptions = {
    httpOnly: true,
    sameSite: config.getEnv("NODE_ENV") !== "development" ? "none" : "lax",
    secure: config.getEnv("NODE_ENV") !== "development",
    maxAge: Number(config.getEnv("REFRESH_TOKEN_MAX_AGE")),
};

// stripe constants
export const myStripe = new Stripe(config.getEnv("STRIPE_SECRET_KEY"));
export const stripePriceId = config.getEnv("SUBSCRIPTION_PRICE_ID");
export const subscriptionTrialPeriodDays = config.getEnv("SUBSCRIPTION_TRIAL_PERIOD_DAYS");
export const stripeWebhookSecret = config.getEnv("STRIPE_WEBHOOK_SECRET");

export const stripeSuccessUrl = config.getEnv("SUBSCRIPTION_SUCCESS_URL");
export const stripeCancelUrl = config.getEnv("SUBSCRIPTION_CANCEL_URL");
export const stripeReturnUrl = config.getEnv("SUBSCRIPTION_RETURN_URL");

export const stripeMonthlyPrice = "price_1PfL4vFThvHN5fHL9uAV1TWw";
export const stripeYearlyPrice = "price_1PfL79FThvHN5fHLmo9XrXQa";
export const stripeLifetimePrice = "price_1PfL8WFThvHN5fHLnvScngMM";
