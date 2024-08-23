import { NextFunction, Request, Response } from "express";
import { ControllerType } from "../types/globalTypes.js";
import { Socket } from "socket.io";

export const TryCatch = (fun: ControllerType) => (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fun(req, res, next)).catch(next);
};
export const TryCatchSocket = (
    fn: (err: Error, socket: Socket, next: (err?: Error) => void) => Promise<void>
) => {
    return (err: Error, socket: Socket, next: (err?: Error) => void) => {
        fn(err, socket, next).catch(next);
    };
};
