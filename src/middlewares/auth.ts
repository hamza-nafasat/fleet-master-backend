import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { Server, Socket } from "socket.io";
import { accessTokenOptions, refreshTokenOptions } from "../constants/constants.js";
import { User } from "../models/userModel/user.model.js";
import { JWTService } from "../services/jwtToken.js";
import { TryCatch, TryCatchSocket } from "../utils/tryCatch.js";
import { Employ } from "../models/employModel/employ.model.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}
declare module "socket.io" {
  interface Socket {
    user?: any;
    cookies?: { [key: string]: string };
  }
}

export const auth = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies?.accessToken;
    let verifyToken: any;
    let receivedUser: any;
    if (accessToken) {
      verifyToken = await JWTService().verifyAccessToken(accessToken);
      let user = await User.findById(verifyToken?._id);
      if (!user) user = await Employ.findById(verifyToken?._id);

      if (!user) return next(createHttpError(401, "Unauthorized user please login"));
      receivedUser = user;
    } else {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) return next(createHttpError(401, "Unauthorized user please login"));
      verifyToken = await JWTService().verifyRefreshToken(refreshToken);
      if (verifyToken) {
        let user = await User.findById(verifyToken?._id);
        if (!user) user = await Employ.findById(verifyToken?._id);
        console.log("user", user);
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
        receivedUser = user;
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
      let user = await User.findById(verifyToken?._id);
      if (!user) user = await Employ.findById(verifyToken?._id);
      if (!user) return next(createHttpError(401, "Unauthorized user please login"));
      receivedUser = user;
    } else {
      const refreshToken = socket.request.cookies?.refreshToken;
      if (!refreshToken) return next(createHttpError(401, "Unauthorized user please login"));
      verifyToken = await JWTService().verifyRefreshToken(refreshToken);
      let user = await User.findById(verifyToken?._id);
      if (!user) user = await Employ.findById(verifyToken?._id);
      if (!user) return next(createHttpError(401, "Unauthorized user please login"));
      receivedUser = user;
    }
    socket.user = receivedUser;
    next();
  } catch (error) {
    next(createHttpError(401, "Unauthorized user please login"));
  }
});
export const isSiteManager = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  let user = req.user;
  if (user?.role == "user") return next();
  if (user?.role == "site-manager") {
    req.user = { ...user?._doc, _id: user?.ownerId };
    return next();
  }
  return next(createHttpError(403, "You are not authorized for this operation"));
});
export const isPaymentManager = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  let user = req.user;
  if (user?.role == "user") return next();
  if (user?.role == "payment-manager") {
    req.user = { ...user?._doc, _id: user?.ownerId };
    return next();
  }
  return next(createHttpError(403, "You are not authorized for this operation"));
});
export const isReportsManager = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  let user = req.user;
  if (user?.role == "user") return next();
  if (user?.role == "report-manager") {
    req.user = { ...user?._doc, _id: user?.ownerId };
    return next();
  }
  return next(createHttpError(403, "You are not authorized for this operation"));
});
export const isAnyAuthUser = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  let user = req.user;
  if (user?.role == "user") return next();
  if (user?.role == "report-manager" || user?.role == "site-manager" || user?.role == "payment-manager") {
    req.user = { ...user?._doc, _id: user?.ownerId };
    return next();
  }
  return next(createHttpError(403, "You are not authorized for this operation"));
});
