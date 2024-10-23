import {
  addTruckAndArea,
  createGeoFence,
  deleteSingleGeoFence,
  getAllGeoFences,
  getSingleGeoFence,
  removeTruckFromGeoFence,
  updateSingleGeoFences,
} from "../../controllers/geoFence/geoFenceController.js";
import { auth, isSiteManager } from "../../middlewares/auth.js";

export const geoFneceRoutes = (app: any) => {
  // create geofence
  app.post("/api/geofence/create", auth, createGeoFence);

  // get edit delete geofence
  app
    .route("/api/geofence/single/:geoFenceId")
    .get(auth, isSiteManager, getSingleGeoFence)
    .put(auth, isSiteManager, updateSingleGeoFences)
    .delete(auth, isSiteManager, deleteSingleGeoFence);

  // add truck and area geofence
  app.put("/api/geofence/add-truck/:geoFenceId", auth, isSiteManager, addTruckAndArea);

  // remove truck from geofence
  app.put("/api/geofence/remove-truck/:geoFenceId", auth, isSiteManager, removeTruckFromGeoFence);

  // get all geofences
  app.get("/api/geofence/all", auth, isSiteManager, getAllGeoFences);
};
