import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { Server, Socket } from "socket.io";
import { accessTokenOptions, refreshTokenOptions } from "../constants/constants.js";
import { User } from "../models/userModel/user.model.js";
import { JWTService } from "../services/jwtToken.js";
import { TryCatch, TryCatchSocket } from "../utils/tryCatch.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: { _id: string; role: string; email: string };
  }
}
declare module "socket.io" {
  interface Socket {
    user?: { _id: string; role: string; email: string };
    cookies?: { [key: string]: string };
  }
}
interface JWTPayload {
  _id: string;
}
interface UserDocument {
  _id: string;
  role: string;
}

export const auth = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies?.accessToken;
    let verifyToken: any;
    let receivedUser: any;
    if (accessToken) {
      verifyToken = await JWTService().verifyAccessToken(accessToken);
      const user = await User.findById(verifyToken._id).select(["_id", "role", "email"]);
      if (!user) return next(createHttpError(401, "Unauthorized user please login"));
      receivedUser = { _id: String(user._id), role: user?.role, email: user?.email };
    } else {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) return next(createHttpError(401, "Unauthorized user please login"));
      verifyToken = await JWTService().verifyRefreshToken(refreshToken);
      if (verifyToken) {
        const user = await User.findById(verifyToken._id).select(["_id", "role", "email"]);
        if (!user) return next(createHttpError(401, "Unauthorized user please login"));
        // create new access and refresh token
        const [newAccessToken, newRefreshToken] = await Promise.all([
          JWTService().accessToken(String(user._id)),
          JWTService().refreshToken(String(user._id)),
        ]);
        // remove old Refresh Token and save new refresh token
        await Promise.all([
          JWTService().removeRefreshToken(String(refreshToken)),
          JWTService().storeRefreshToken(String(newRefreshToken)),
        ]);
        res.cookie("accessToken", newAccessToken, accessTokenOptions);
        res.cookie("refreshToken", newRefreshToken, refreshTokenOptions);
        receivedUser = { _id: String(user._id), role: user?.role, email: user?.email };
      }
    }
    req.user = receivedUser;
    next();
  } catch (error) {
    next(createHttpError(401, "Unauthorized user please login"));
  }
});

export const isAdmin = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin")
    return next(createHttpError(403, "You are not authorized for this operation"));
  next();
});

export const isSocketAuth = TryCatchSocket(async (err: Error, socket: any, next: (err?: Error) => void) => {
  try {
    const accessToken = socket.request.cookies?.accessToken;
    let verifyToken: any;
    let receivedUser: any;
    if (accessToken) {
      verifyToken = await JWTService().verifyAccessToken(accessToken);
      const user = await User.findById(verifyToken._id).select(["_id", "role", "email"]);
      if (!user) return next(createHttpError(401, "Unauthorized user please login"));
      receivedUser = { _id: String(user._id), role: user?.role, email: user?.email };
    } else {
      const refreshToken = socket.request.cookies?.refreshToken;
      if (!refreshToken) return next(createHttpError(401, "Unauthorized user please login"));
      verifyToken = await JWTService().verifyRefreshToken(refreshToken);
      const user = await User.findById(verifyToken._id).select(["_id", "role", "email"]);
      if (!user) return next(createHttpError(401, "Unauthorized user please login"));
      receivedUser = { _id: String(user._id), role: user?.role, email: user?.email };
    }
    socket.user = receivedUser;
    next();
  } catch (error) {
    next(createHttpError(401, "Unauthorized user please login"));
  }
});
