import { NextFunction, Request } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";

const handleValidatorError = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createHttpError(400, errors.array()[0].msg));
    next();
};

export default handleValidatorError;
