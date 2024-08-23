import {
    addSensorData,
    createDevice,
    deleteDevice,
    getAllDevices,
    getSingleDeviceLatestData,
    updateDevice,
} from "../../controllers/device/deviceController.js";
import { auth } from "../../middlewares/auth.js";

const deviceRoutes = (app: any) => {
    // create new device
    app.post("/api/device/create", auth, createDevice);

    // update device and delete device
    app.route("/api/device/single/:deviceId").put(auth, updateDevice).delete(auth, deleteDevice);

    // get all devices
    app.get("/api/device/all", auth, getAllDevices);

    // get sensor data
    app.get("/api/device/latest-data", auth, getSingleDeviceLatestData);

    // add sensor data
    app.post("/api/device/add-sensor-data", auth, addSensorData);
};

export { deviceRoutes };
