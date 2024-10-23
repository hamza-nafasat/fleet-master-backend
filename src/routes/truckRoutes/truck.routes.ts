import {
  assignTruckToDriver,
  attachDevice,
  createNewTruck,
  deleteTruck,
  detachDevice,
  getAllTrucks,
  getSingleTruck,
  removeTruckAssignment,
  updateTruck,
} from "../../controllers/truck/truckController.js";
import { auth, isAnyAuthUser, isSiteManager } from "../../middlewares/auth.js";
import { singleUpload } from "../../middlewares/multer.js";
import handleValidatorError from "../../middlewares/validationHandler.js";
import {
  createTruckSanitizer,
  singleTruckSanitizer,
  updateTruckSanitizer,
} from "../../validation/truck.validation.js";

export const truckRoutes = (app: any) => {
  // create new truck
  app.post(
    "/api/truck/create",
    auth,
    isSiteManager,
    singleUpload,
    createTruckSanitizer,
    handleValidatorError,
    createNewTruck
  );

  // update and delete truck
  app
    .route("/api/truck/single/:truckId")
    .get(auth, isSiteManager, singleTruckSanitizer, handleValidatorError, getSingleTruck)
    .put(auth, isSiteManager, singleUpload, updateTruckSanitizer, handleValidatorError, updateTruck)
    .delete(auth, isSiteManager, singleTruckSanitizer, handleValidatorError, deleteTruck);

  // get all trucks
  app.get("/api/truck/all", auth, isAnyAuthUser, getAllTrucks);

  // attach device to truck
  app.put("/api/truck/:truckId/attach-device", auth, isSiteManager, attachDevice);

  // detach device from truck
  app.put("/api/truck/:truckId/detach-device", auth, isSiteManager, detachDevice);
};
