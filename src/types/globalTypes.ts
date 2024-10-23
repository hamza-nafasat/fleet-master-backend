import { NextFunction, Request, Response } from "express";

type ControllerType = (
    req: Request | any,
    res: Response,
    next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

interface CustomRequest extends Request {
    userId: string;
}

interface Config {
    [key: string]: string | undefined;
}

interface CookiesOptionTypes {
    httpOnly: boolean;
    secure: boolean;
    sameSite: string;
    maxAge: number;
}

export { ControllerType, CustomRequest, Config, CookiesOptionTypes };
