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
import { auth } from "../../middlewares/auth.js";
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
        singleUpload,
        createTruckSanitizer,
        handleValidatorError,
        createNewTruck
    );

    // update and delete truck
    app.route("/api/truck/single/:truckId")
        .get(auth, singleTruckSanitizer, handleValidatorError, getSingleTruck)
        .put(auth, singleUpload, updateTruckSanitizer, handleValidatorError, updateTruck)
        .delete(auth, singleTruckSanitizer, handleValidatorError, deleteTruck);

    // get all trucks
    app.get("/api/truck/all", auth, getAllTrucks);

    // attach device to truck
    app.put("/api/truck/:truckId/attach-device", auth, attachDevice);

    // detach device from truck
    app.put("/api/truck/:truckId/detach-device", auth, detachDevice);
};
