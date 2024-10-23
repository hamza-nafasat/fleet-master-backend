import { body, param } from "express-validator";

const createTruckSanitizer = [
  body("truckName")
    .notEmpty()
    .withMessage("Truck name is required")
    .isString()
    .withMessage("Truck name must be a string"),
  body("fleetNumber")
    .notEmpty()
    .withMessage("Fleet number is required")
    .isInt()
    .withMessage("Fleet number must be a number"),
  body("plateNumber")
    .notEmpty()
    .withMessage("Plate number is required")
    .isString()
    .withMessage("Plate number must be a string"),
];

const updateTruckSanitizer = [
  param("truckId").isMongoId().withMessage("Invalid or Missing Truck Id"),
  body("truckName").optional().isString().withMessage("Truck name must be a string"),
  body("fleetNumber").optional().isInt().withMessage("Fleet number must be a number"),
  body("plateNumber").optional().isString().withMessage("Plate number must be a string"),
];

const singleTruckSanitizer = [param("truckId").isMongoId().withMessage("Invalid or Missing Truck Id")];
export { createTruckSanitizer, singleTruckSanitizer, updateTruckSanitizer };
