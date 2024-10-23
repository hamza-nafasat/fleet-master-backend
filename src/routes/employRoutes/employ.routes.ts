import {
    createNewEmploy,
    deleteSingleEmploy,
    getAllEmployees,
    getSingleEmploy,
    updateSingleEmploy,
} from "../../controllers/employs/employsController.js";
import { auth } from "../../middlewares/auth.js";
import { singleUpload } from "../../middlewares/multer.js";
import handleValidatorError from "../../middlewares/validationHandler.js";
import {
    createEmployeeSanitizer,
    singleEmployeeSanitizer,
    updateEmployeeSanitizer,
} from "../../validation/employees.validation.js";

export const employRoutes = (app: any) => {
    // create new user
    app.post(
        "/api/employ/create",
        auth,
        singleUpload,
        createEmployeeSanitizer,
        handleValidatorError,
        createNewEmploy
    );

    // get all users
    app.get("/api/employ/all", auth, getAllEmployees);

    // get single user
    app.route("/api/employ/single/:employId")
        .get(auth, singleEmployeeSanitizer, handleValidatorError, getSingleEmploy)
        .put(auth, singleUpload, updateEmployeeSanitizer, handleValidatorError, updateSingleEmploy)
        .delete(auth, singleEmployeeSanitizer, handleValidatorError, deleteSingleEmploy);
};
