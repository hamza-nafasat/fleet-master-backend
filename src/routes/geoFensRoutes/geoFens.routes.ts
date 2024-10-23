import {
    addTruckAndArea,
    createGeoFence,
    deleteSingleGeoFence,
    getAllGeoFences,
    getSingleGeoFence,
    removeTruckFromGeoFence,
    updateSingleGeoFences,
} from "../../controllers/geoFence/geoFenceController.js";
import { auth } from "../../middlewares/auth.js";

export const geoFneceRoutes = (app: any) => {
    // create geofence
    app.post("/api/geofence/create", auth, createGeoFence);

    // get edit delete geofence
    app.route("/api/geofence/single/:geoFenceId")
        .get(auth, getSingleGeoFence)
        .put(auth, updateSingleGeoFences)
        .delete(auth, deleteSingleGeoFence);

    // add truck and area geofence
    app.put("/api/geofence/add-truck/:geoFenceId", auth, addTruckAndArea);

    // remove truck from geofence
    app.put("/api/geofence/remove-truck/:geoFenceId", auth, removeTruckFromGeoFence);

    // get all geofences
    app.get("/api/geofence/all", auth, getAllGeoFences);
};
