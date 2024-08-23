import { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";

export const Errorhandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    console.log(err);
    return res.status(statusCode).json({
        success: false,
        message: err.message,
    });
};
