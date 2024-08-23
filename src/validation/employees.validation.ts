import { body, param } from "express-validator";

const createEmployeeSanitizer = [
    body("firstName")
        .notEmpty()
        .withMessage("First name is required")
        .isString()
        .withMessage("First name must be a string"),
    body("lastName")
        .notEmpty()
        .withMessage("Last name is required")
        .isString()
        .withMessage("Last name must be a string"),
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email must be a valid email"),
    body("role").notEmpty().withMessage("Role is required").isString().withMessage("Role must be a string"),
    body("phoneNumber")
        .notEmpty()
        .withMessage("Phone number is required")
        .isString()
        .withMessage("Phone number must be a string"),
];

const updateEmployeeSanitizer = [
    param("employId").isMongoId().withMessage("Invalid Employee Id"),
    body("firstName").optional().isString().withMessage("First name must be a string"),
    body("lastName").optional().isString().withMessage("Last name must be a string"),
    body("email").optional().isEmail().withMessage("Email must be a valid email"),
    body("role").optional().isString().withMessage("Role must be a string"),
    body("phoneNumber").optional().isString().withMessage("Phone number must be a string"),
];

const singleEmployeeSanitizer = [param("employId").isMongoId().withMessage("Invalid Employee Id")];

export { createEmployeeSanitizer, updateEmployeeSanitizer, singleEmployeeSanitizer };
