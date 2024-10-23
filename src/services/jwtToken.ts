import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { Token } from "../models/tokenModel/token.model.js";
import createHttpError from "http-errors";

export const JWTService = () => {
    return {
        // create access token
        async accessToken(_id: string) {
            return jwt.sign({ _id }, config.getEnv("ACCESS_TOKEN_SECRET"), {
                expiresIn: config.getEnv("ACCESS_TOKEN_EXPIRY_TIME"),
            });
        },

        // create refresh token
        async refreshToken(_id: string) {
            return jwt.sign({ _id }, config.getEnv("REFRESH_TOKEN_SECRET"), {
                expiresIn: config.getEnv("REFRESH_TOKEN_EXPIRY_TIME"),
            });
        },

        // verify access token
        async verifyAccessToken(token: string) {
            return jwt.verify(token, config.getEnv("ACCESS_TOKEN_SECRET"));
        },

        // verify refresh token
        async verifyRefreshToken(token: string) {
            return jwt.verify(token, config.getEnv("REFRESH_TOKEN_SECRET"));
        },

        // store refresh token in database
        async storeRefreshToken(token: string) {
            try {
                await Token.create({ token });
            } catch (error: any) {
                throw createHttpError(400, error?.message || error || "Failed to store refresh token");
            }
        },

        // remove from data base
        async removeRefreshToken(token: string) {
            try {
                await Token.deleteOne({ token });
            } catch (error: any) {
                throw createHttpError(400, error?.message || error || "Failed to remove refresh token");
            }
        },

        // create access token
        async createVerificationToken(_id: string) {
            return jwt.sign({ _id }, config.getEnv("ACCESS_TOKEN_SECRET"), {
                expiresIn: config.getEnv("ACCESS_TOKEN_EXPIRY_TIME"),
            });
        },

        // verify verification token
        async verifyVerificationToken(token: string) {
            return jwt.verify(token, config.getEnv("ACCESS_TOKEN_SECRET"));
        },
    };
};
