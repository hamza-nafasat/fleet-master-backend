import mongoose from "mongoose";
import {
  findClientNotifications,
  isInClientNotificationsType,
  socketEvent,
  watchPolygonTrucksData,
} from "../constants/socketState.js";
import { Truck } from "../models/truckModel/truck.model.js";
import { emitEvent, emitNotification } from "./socket.js";
import pointInPolygon from "point-in-polygon";
import GeoFence from "../models/geoFenceModel/geoFence.model.js";
import { addNotificationInDb } from "./addNotification.js";
import { Report } from "../models/reportModel/report.modal.js";
import Notification from "../models/notificationModel/notification.model.js";

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
      // console.log("payload", payload);
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
        trucks: { $in: [truckId] },
        status: "active",
      });
      // if exist in geofence then check if it is in or out and create a notification
      if (isTruckInAnyGeoFence) {
        const clientNotifications = findClientNotifications(ownerId);
        const coordinatesOfArea = isTruckInAnyGeoFence.area?.coordinates;
        const alertType = isTruckInAnyGeoFence?.alert;
        let isTruckCrossedGeoFence = checkIfTruckInsideGeoFence(
          coordinatesOfArea,
          truckLatitude,
          truckLongitude
        );
        // console.log("alert types", alertType, isTruckCrossedGeoFence);
        // console.log("clientNotifications", clientNotifications);

        if (isInClientNotificationsType("infence", clientNotifications) && isTruckCrossedGeoFence == "in") {
          // console.log("truck is in geo fence");
          if (alertType == "infence") {
            await addNotificationInDb(ownerId, alertType, "Truck Entered In Marked Area", String(truckId));
          }
        }
        if (
          isInClientNotificationsType("outfence", clientNotifications) &&
          isTruckCrossedGeoFence == "out"
        ) {
          // console.log("truck is out of geo fence");
          if (alertType == "outfence") {
            await addNotificationInDb(ownerId, alertType, "Truck Crossed Marked Area", String(truckId));
          }
        }
        if (isInClientNotificationsType("speed", clientNotifications)) {
          if (speed > 50) {
            await addNotificationInDb(ownerId, "speed", "Truck Speed Exceeded", String(truckId));
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

const notificationWatcher = () => {
  const notificationWatcher = mongoose.connection.collection("notifications");
  const changeStream = notificationWatcher.watch();
  changeStream.on("change", async (change: any) => {
    if (change.operationType === "insert") {
      const document = change.fullDocument;
      // console.log("notification added", document);
      const toId = document?.to;
      await emitNotification(socketEvent.NOTIFICATIONS, toId, "notification");
    }
  });
};

export { sensorWatcher, notificationWatcher };
