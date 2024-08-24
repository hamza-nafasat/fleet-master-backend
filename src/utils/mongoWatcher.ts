import mongoose from "mongoose";
import { socketEvent, watchPolygonTrucksData } from "../constants/socketState.js";
import { Truck } from "../models/truckModel/truck.model.js";
import { emitEvent } from "./socket.js";
import pointInPolygon from "point-in-polygon";
import GeoFence from "../models/geoFenceModel/geoFence.model.js";
import { addNotificationInDb } from "./addNotification.js";
import { Report } from "../models/reportModel/report.modal.js";

const sensorWatcher = () => {
  const sensorsCollection = mongoose.connection.collection("sensors");
  const changeStream = sensorsCollection.watch();
  changeStream.on("change", async (change: any) => {
    if (change.operationType === "insert") {
      const document = change.fullDocument;
      const payload = JSON.parse(document?.payload);
      const truckId = payload.truckId;
      const ownerId = payload.ownerId;
      const truckLatitude = payload.gps.latitude;
      const truckLongitude = payload.gps.longitude;
      const speed = payload?.speed;
      if (watchPolygonTrucksData.has(String(truckId))) {
        const updateTruckPromise = Truck.findByIdAndUpdate(
          truckId,
          { latitude: truckLatitude, longitude: truckLongitude },
          { new: true }
        );
        const reportPromise = Report.create({
          ownerId,
          truck: truckId,
          latitude: truckLatitude,
          longitude: truckLongitude,
          speed,
        });
        await Promise.all([updateTruckPromise, reportPromise]);
        emitEvent(socketEvent.GEOFENCE_TRUCKS_DATA, ownerId, "get single truck data data again");
      }
      // find that truck exist in any geofence
      const isTruckInAnyGeoFence = await GeoFence.findOne({
        ownerId,
        trucks: truckId,
        status: "active",
      });
      // if exist in geofence then check if it is in or out and create a notification
      if (isTruckInAnyGeoFence) {
        const coordinatesOfArea = isTruckInAnyGeoFence.area?.coordinates;
        const alertType = isTruckInAnyGeoFence?.alert;
        let isTruckCrossedGeoFence = checkIfTruckInsideGeoFence(
          coordinatesOfArea,
          truckLatitude,
          truckLongitude
        );
        if (alertType == "infence") {
          if (isTruckCrossedGeoFence == "in") {
            console.log("truck is in geo fence");
            addNotificationInDb(ownerId, alertType, "Truck Entered In Marked Area");
          }
        }
        if (alertType == "outfence") {
          if (isTruckCrossedGeoFence == "out") {
            addNotificationInDb(ownerId, alertType, "Truck Crossed Marked Area");
          }
        }
      }
    }
  });
};

const checkIfTruckInsideGeoFence = (polygonCoordinates: any, lat: any, lng: any) => {
  const formattedPolygon = polygonCoordinates.map((coord: any) => [coord[1], coord[0]]);
  const isInside = pointInPolygon([lng, lat], formattedPolygon);
  return isInside ? "in" : "out";
};

export { sensorWatcher };
