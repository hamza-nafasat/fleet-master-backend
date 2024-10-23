import {
    createNewDriver,
    deleteDriver,
    getAllDrivers,
    getSingleDriver,
    updateDriver,
} from "../../controllers/driver/driverController.js";
import { auth } from "../../middlewares/auth.js";
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
        singleUpload,
        createDriverSanitizer,
        handleValidatorError,
        createNewDriver
    );

    // update drivers and delete
    app.route("/api/driver/single/:driverId")
        .get(auth, singleDriverSanitizer, handleValidatorError, getSingleDriver)
        .put(auth, singleUpload, updateDriverSanitizer, handleValidatorError, updateDriver)
        .delete(auth, singleDriverSanitizer, handleValidatorError, deleteDriver);

    // get all drivers
    app.get("/api/driver/all", auth, getAllDrivers);
};
