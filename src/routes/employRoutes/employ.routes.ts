import {
  createNewEmploy,
  deleteSingleEmploy,
  getAllEmployees,
  getSingleEmploy,
  updateSingleEmploy,
} from "../../controllers/employs/employsController.js";
import { auth, isSiteManager } from "../../middlewares/auth.js";
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
    isSiteManager,
    singleUpload,
    createEmployeeSanitizer,
    handleValidatorError,
    createNewEmploy
  );

  // get all users
  app.get("/api/employ/all", auth, isSiteManager, getAllEmployees);

  // get single user
  app
    .route("/api/employ/single/:employId")
    .get(auth, isSiteManager, singleEmployeeSanitizer, handleValidatorError, getSingleEmploy)
    .put(
      auth,
      isSiteManager,
      singleUpload,
      updateEmployeeSanitizer,
      handleValidatorError,
      updateSingleEmploy
    )
    .delete(auth, isSiteManager, singleEmployeeSanitizer, handleValidatorError, deleteSingleEmploy);
};
