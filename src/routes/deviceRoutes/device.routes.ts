import {
  addSensorData,
  createDevice,
  deleteDevice,
  getAllDevices,
  getSingleDeviceLatestData,
  getUserLatestDeviceData,
  getUserLatestDevicesData,
  updateDevice,
} from "../../controllers/device/deviceController.js";
import { auth, isSiteManager } from "../../middlewares/auth.js";

const deviceRoutes = (app: any) => {
  // create new device
  app.post("/api/device/create", auth, isSiteManager, createDevice);

  // update device and delete device
  app
    .route("/api/device/single/:deviceId")
    .put(auth, isSiteManager, updateDevice)
    .delete(auth, isSiteManager, deleteDevice);

  // get all devices
  app.get("/api/device/all", auth, isSiteManager, getAllDevices);

  // get sensor data
  app.get("/api/device/latest-data", auth, isSiteManager, getSingleDeviceLatestData);

  // add sensor data
  app.post("/api/device/add-sensor-data", auth, isSiteManager, addSensorData);

  // get latest device data
  app.get("/api/sensor/latest-data", auth, isSiteManager, getUserLatestDeviceData);

  // get user all devices latest data
  app.get("/api/sensors/latest-data", auth, isSiteManager, getUserLatestDevicesData);
};

export { deviceRoutes };
