import { body, query } from "express-validator";

const registerSanitizer = [
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
        .withMessage("Please Enter a Valid Email"),
    body("address")
        .notEmpty()
        .withMessage("Address is required")
        .isString()
        .withMessage("Address must be a string"),
    body("phoneNumber")
        .notEmpty()
        .withMessage("Phone number is required")
        .isString()
        .withMessage("Phone number must be a string"),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isString()
        .withMessage("Password must be a string"),
];

const loginSanitizer = [
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please Enter a Valid Email"),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isString()
        .withMessage("Password must be a string"),
];

const forgetPasswordSanitizer = [
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please Enter a Valid Email"),
];

const resetPasswordSanitizer = [
    body("newPassword")
        .notEmpty()
        .withMessage("New password is required")
        .isString()
        .withMessage("New password must be a string"),
    query("resetToken")
        .notEmpty()
        .withMessage("Reset token is required")
        .isString()
        .withMessage("Reset token must be a string"),
];

export { registerSanitizer, loginSanitizer, forgetPasswordSanitizer, resetPasswordSanitizer };
