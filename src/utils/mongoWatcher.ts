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
import { Device } from "../models/deviceModel/device.model.js";
import GeoFence from "../models/geoFenceModel/geoFence.model.js";
import { Report } from "../models/reportModel/report.modal.js";
import { Truck } from "../models/truckModel/truck.model.js";
import { User } from "../models/userModel/user.model.js";
import { sendNotificationMail } from "../services/sendMail.js";
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
      const uniqueId = payload?.uniqueId;
      let device: any = await Device.exists({ uniqueId });
      let truckFullData: any;
      if (watchPolygonTrucksData.has(String(truckId)) && device?._id) {
        const updateTruckPromise = Truck.findOneAndUpdate(
          {
            $and: [
              { _id: truckId },
              { ["devices._id"]: device?._id },
              { ["devices.uniqueId"]: device?._id },
            ],
          },
          { latitude: truckLatitude, longitude: truckLongitude },
          { new: true }
        );
        const truckFullDataPromise = Truck.findById(truckId).populate("assignedTo");
        const reportPromise = Report.create({
          ownerId,
          truck: truckId,
          latitude: truckLatitude,
          longitude: truckLongitude,
          speed,
        });
        let [updatedTruck, report, truck] = await Promise.all([
          updateTruckPromise,
          reportPromise,
          truckFullDataPromise,
        ]);
        truckFullData = truck;
        if (truck) {
          console.log("truck", truck);
          emitEvent(socketEvent.GEOFENCE_TRUCKS_DATA, ownerId, "get single truck data data again");
        } else {
          console.log("some error while fetching single truck data");
        }
      }
      // find that truck exist in any geofence
      const [isTruckInAnyGeoFence, userData] = await Promise.all([
        GeoFence.findOne({
          ownerId,
          trucks: { $in: [truckId] },
          status: "active",
          $and: [{ startDate: { $lte: new Date() } }, { endDate: { $gte: new Date() } }],
        }),
        User.findById(ownerId).select("email firstName lastName"),
      ]);
      // if exist in geofence then check if it is in or out and create a notification
      if (isTruckInAnyGeoFence && userData && truckFullData) {
        const clientNotifications = findClientNotifications(ownerId);
        const coordinatesOfArea = isTruckInAnyGeoFence.area?.coordinates;
        const alertType = isTruckInAnyGeoFence?.alert;
        let isTruckCrossed = checkIfTruckInsideGeoFence(coordinatesOfArea, truckLatitude, truckLongitude);
        // console.log("alert types", alertType, isTruckCrossed);
        // console.log("clientNotifications", clientNotifications);

        // send notification in-fence
        // --------------------------
        if (isTruckCrossed == "in") {
          // remove from out-fence notificationSent
          removeInSentNotification("outfence", truckId);
          const inFenceInClientNotification = isInClientNotificationsType("infence", clientNotifications);
          if (inFenceInClientNotification) {
            // console.log("truck is in geo fence");
            if (alertType == "infence") {
              const isInFenceNotificationSent = isAlreadySentNotification("infence", truckId);
              if (!isInFenceNotificationSent) {
                // add in sent notification
                addInSentNotification("infence", truckId);
                console.log("in fence notifications ", inFenceInClientNotification);
                // send notification
                if (inFenceInClientNotification.platform == "platform") {
                  await addNotificationInDb(
                    ownerId,
                    alertType,
                    "Truck Entered In Marked Area",
                    String(truckId)
                  );
                } else if (inFenceInClientNotification.platform == "email") {
                  const inFenceText = `Your vehicle with plate number <strong>${truckFullData?.plateNumber}</strong> which is currently connected with <strong>${truckFullData?.assignedTo?.firstName} ${truckFullData?.assignedTo?.lastName}</strong> is entered in marked area. Check more details here:  <a href="http://localhost:5173/dashboard/truck-detail/${truckFullData?._id}">Truck Details</a>`;
                  await sendNotificationMail({
                    to: userData?.email,
                    subject: "In Fence Alert",
                    severity: inFenceInClientNotification?.severity,
                    text: inFenceText,
                    userName: `${userData.firstName} ${userData.lastName}`,
                    truckId: truckFullData?._id,
                  });
                }
              }
            }
          }
        }

        // send out-fence notification
        // --------------------------
        if (isTruckCrossed == "out") {
          // remove from in-fence notificationSent
          removeInSentNotification("infence", truckId);
          const outFenceInClientNotification = isInClientNotificationsType("outfence", clientNotifications);
          if (outFenceInClientNotification) {
            // console.log("truck is out of geo fence");
            if (alertType == "outfence") {
              const isOutFenceNotificationSent = isAlreadySentNotification("outfence", truckId);
              if (!isOutFenceNotificationSent) {
                // add in sent notification
                addInSentNotification("outfence", truckId);
                // send notification
                if (outFenceInClientNotification?.platform == "platform") {
                  await addNotificationInDb(
                    ownerId,
                    alertType,
                    "Truck Crossed Marked Area",
                    String(truckId)
                  );
                } else if (outFenceInClientNotification?.platform == "email") {
                  const outFenceText = `Your vehicle with plate number <strong>${truckFullData?.plateNumber}</strong> is exited from marked area.`;
                  await sendNotificationMail({
                    to: userData?.email,
                    subject: "Out Fence Alert",
                    severity: outFenceInClientNotification?.severity,
                    text: outFenceText,
                    userName: `${userData.firstName} ${userData.lastName}`,
                    truckId: truckFullData?._id,
                  });
                }
              }
            }
          }
        }
        // send out speed notification
        // --------------------------
        if (speed > 50) {
          const speedInClientNotification = isInClientNotificationsType("speed", clientNotifications);
          if (speedInClientNotification) {
            const isSpeedNotificationSent = isAlreadySentNotification("speed", truckId);
            if (!isSpeedNotificationSent) {
              // add in sent notification
              addInSentNotification("speed", truckId);
              // send notification
              if (speedInClientNotification?.platform == "platform") {
                await addNotificationInDb(ownerId, "speed", "Truck Speed Exceeded", String(truckId));
              } else if (speedInClientNotification?.platform == "email") {
                const outFenceText = `Your vehicle with plate number <strong>${truckFullData?.plateNumber}</strong> is Over Speeding.`;
                await sendNotificationMail({
                  to: userData?.email,
                  subject: "Speed Alert",
                  severity: speedInClientNotification?.severity,
                  text: outFenceText,
                  userName: `${userData.firstName} ${userData.lastName}`,
                  truckId: truckFullData?._id,
                });
              }
            }
          }
        }
        // remove from sent notifications if speed is slow after fast
        if (speed < 50) {
          removeInSentNotification("speed", truckId);
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
