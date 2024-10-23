import {
  createNewDriver,
  deleteDriver,
  getAllDrivers,
  getSingleDriver,
  updateDriver,
} from "../../controllers/driver/driverController.js";
import { auth, isSiteManager } from "../../middlewares/auth.js";
import { singleUpload } from "../../middlewares/multer.js";
import handleValidatorError from "../../middlewares/validationHandler.js";
import {
  createDriverSanitizer,
  singleDriverSanitizer,
  updateDriverSanitizer,
} from "../../validation/driver.validation.js";

export const driverRoutes = (app: any) => {
  // register user
  app.post(
    "/api/driver/create",
    auth,
    isSiteManager,
    singleUpload,
    createDriverSanitizer,
    handleValidatorError,
    createNewDriver
  );

  // update drivers and delete
  app
    .route("/api/driver/single/:driverId")
    .get(auth, isSiteManager, singleDriverSanitizer, handleValidatorError, getSingleDriver)
    .put(auth, isSiteManager, singleUpload, updateDriverSanitizer, handleValidatorError, updateDriver)
    .delete(auth, isSiteManager, singleDriverSanitizer, handleValidatorError, deleteDriver);

  // get all drivers
  app.get("/api/driver/all", auth, isSiteManager, getAllDrivers);
};
