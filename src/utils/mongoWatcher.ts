import mongoose from "mongoose";
import pointInPolygon from "point-in-polygon";
import {
  addInSentNotification,
  findClientNotifications,
  isAlreadySentNotification,
  isInClientNotificationsType,
  removeInSentNotification,
  socketEvent,
  watchPolygonTrucksData,
} from "../constants/socketState.js";
import GeoFence from "../models/geoFenceModel/geoFence.model.js";
import { Report } from "../models/reportModel/report.modal.js";
import { Truck } from "../models/truckModel/truck.model.js";
import { addNotificationInDb } from "./addNotification.js";
import { emitEvent, emitNotification } from "./socket.js";

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
        let isTruckCrossed = checkIfTruckInsideGeoFence(coordinatesOfArea, truckLatitude, truckLongitude);
        // console.log("alert types", alertType, isTruckCrossed);
        // console.log("clientNotifications", clientNotifications);

        // send notification in-fence
        // --------------------------
        if (isInClientNotificationsType("infence", clientNotifications) && isTruckCrossed == "in") {
          // remove from out-fence notificationSent
          removeInSentNotification("outfence", truckId);
          // console.log("truck is in geo fence");
          if (alertType == "infence") {
            const isInFenceNotificationSent = isAlreadySentNotification("infence", truckId);
            if (!isInFenceNotificationSent) {
              // add in sent notification
              addInSentNotification("infence", truckId);
              // send notification
              await addNotificationInDb(
                ownerId,
                alertType,
                "Truck Entered In Marked Area",
                String(truckId)
              );
            }
          }
        }
        // send out-fence notification
        // --------------------------
        if (isInClientNotificationsType("outfence", clientNotifications) && isTruckCrossed == "out") {
          // remove from in-fence notificationSent
          removeInSentNotification("infence", truckId);
          // console.log("truck is out of geo fence");
          if (alertType == "outfence") {
            const isOutFenceNotificationSent = isAlreadySentNotification("outfence", truckId);
            if (!isOutFenceNotificationSent) {
              // add in sent notification
              addInSentNotification("outfence", truckId);
              // send notification
              await addNotificationInDb(ownerId, alertType, "Truck Crossed Marked Area", String(truckId));
            }
          }
        }
        // send out speed notification
        // --------------------------
        if (isInClientNotificationsType("speed", clientNotifications)) {
          if (speed > 50) {
            const isSpeedNotificationSent = isAlreadySentNotification("speed", truckId);
            if (!isSpeedNotificationSent) {
              // add in sent notification
              addInSentNotification("speed", truckId);
              // send notification
              await addNotificationInDb(ownerId, "speed", "Truck Speed Exceeded", String(truckId));
            }
          }
        }
        // remove from sent notifications if speed is slow after fast
        if (isInClientNotificationsType("speed", clientNotifications)) {
          if (speed < 50) {
            removeInSentNotification("speed", truckId);
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

export { notificationWatcher, sensorWatcher };
