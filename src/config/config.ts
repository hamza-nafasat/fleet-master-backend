import { config as dotEnvConfig } from "dotenv";
import { Config } from "../types/globalTypes.js";

dotEnvConfig();

const _config: Config = {
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY_TIME: process.env.ACCESS_TOKEN_EXPIRY_TIME,
    ACCESS_TOKEN_MAX_AGE: process.env.ACCESS_TOKEN_MAX_AGE,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRY_TIME: process.env.REFRESH_TOKEN_EXPIRY_TIME,
    REFRESH_TOKEN_MAX_AGE: process.env.REFRESH_TOKEN_MAX_AGE,
    CLOUDINARY_CLIENT_KEY: process.env.CLOUDINARY_CLIENT_KEY,
    CLOUDINARY_CLIENT_NAME: process.env.CLOUDINARY_CLIENT_NAME,
    CLOUDINARY_CLIENT_SECRET: process.env.CLOUDINARY_CLIENT_SECRET,
    SERVER_URL: process.env.SERVER_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    RESET_PASSWORD_URL: process.env.RESET_PASSWORD_URL,
    NODEMAILER_HOST: process.env.NODEMAILER_HOST,
    NODEMAILER_PORT: process.env.NODEMAILER_PORT,
    NODEMAILER_USER: process.env.NODEMAILER_USER,
    NODEMAILER_FROM: process.env.NODEMAILER_FROM,
    NODEMAILER_PASSWORD: process.env.NODEMAILER_PASSWORD,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    // STRIPE
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISH_KEY: process.env.STRIPE_PUBLISH_KEY,
    SUBSCRIPTION_PRICE_ID: process.env.SUBSCRIPTION_PRICE_ID,
    SUBSCRIPTION_TRIAL_PERIOD_DAYS: process.env.SUBSCRIPTION_TRIAL_PERIOD_DAYS,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    SUBSCRIPTION_SUCCESS_URL: process.env.SUBSCRIPTION_SUCCESS_URL,
    SUBSCRIPTION_CANCEL_URL: process.env.SUBSCRIPTION_CANCEL_URL,
    SUBSCRIPTION_RETURN_URL: process.env.SUBSCRIPTION_RETURN_URL,
};

export const config = {
    getEnv: (key: string): string => {
        const value: string | undefined = _config[key];
        if (!value) throw new Error(`Missing environment variable ${key}`);
        return value;
    },
};
