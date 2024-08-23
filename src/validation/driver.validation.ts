import { body, param, query } from "express-validator";

const createDriverSanitizer = [
    body("firstName")
        .notEmpty()
        .withMessage("First name is required ")
        .isString()
        .withMessage("First name must be a string"),
    body("lastName")
        .notEmpty()
        .withMessage("Last name is required")
        .isString()
        .withMessage("Last name must be a string"),
    body("phoneNumber")
        .notEmpty()
        .withMessage("Phone number is required")
        .isMobilePhone("any")
        .withMessage("Phone number must be a valid phone number"),
    body("fleetNumber")
        .notEmpty()
        .withMessage("Fleet number is required")
        .isInt()
        .withMessage("Fleet number must be a number"),
    body("licenseExpiry")
        .notEmpty()
        .withMessage("License expiry is required")
        .isDate()
        .withMessage("License expiry must be a date"),
];

const updateDriverSanitizer = [
    body("firstName").optional().isString().withMessage("First name must be a string"),
    body("lastName").optional().isString().withMessage("Last name must be a string"),
    body("phoneNumber")
        .optional()
        .isMobilePhone("any")
        .withMessage("Phone number must be a valid phone number"),
    body("fleetNumber").optional().isInt().withMessage("Fleet number must be a number"),
    body("licenseExpiry").optional().isDate().withMessage("License expiry must be a date"),
    body("removeAssignedTruck").optional().isMongoId().withMessage("Assigned truck must be a valid truck id"),
];

const singleDriverSanitizer = [param("driverId").isMongoId().withMessage("Invalid Driver Id")];

export { createDriverSanitizer, updateDriverSanitizer, singleDriverSanitizer };
