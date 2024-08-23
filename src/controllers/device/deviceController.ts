import { NextFunction, Request, Response } from "express";
import { Device } from "../../models/deviceModel/device.model.js";
import { TryCatch } from "../../utils/tryCatch.js";
import { DeviceTypes } from "../../types/device.types.js";
import createHttpError from "http-errors";
import Sensor from "../../models/sensorModel/sensor.model.js";

// create device
// -------------
const createDevice = TryCatch(
  async (req: Request<{}, {}, DeviceTypes>, res: Response, next: NextFunction) => {
    const ownerId = req.user?._id;
    const { name, type, ip, uniqueId, url } = req.body;
    if (!name || !type || !ip || !uniqueId)
      return next(createHttpError.BadRequest("All fields are required"));
    if (type === "vide" && !url) return next(createHttpError.BadRequest("Url is required for video sensor"));
    await Device.create({ name, type, ip, uniqueId, ownerId, url: url || null });
    res.status(201).json({ success: true, message: "Device created successfully" });
  }
);

// get single device
// -----------------
const getSingleDevice = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const ownerId = req.user?._id;
  const deviceId = req?.params?.deviceId;
  const device = await Device.findOne({ _id: deviceId, ownerId });
  if (!device) return next(createHttpError.NotFound("Device Not Found"));
  res.status(200).json({ success: true, data: device });
});

// update device
// -------------
const updateDevice = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const ownerId = req.user?._id;
  const deviceId = req?.params?.deviceId;
  const { name, type, ip, uniqueId, url } = req.body;
  if (!name && !type && !ip && !uniqueId && !url) {
    return next(createHttpError.BadRequest("Nothing For Update"));
  }
  const device = await Device.findOne({ _id: deviceId, ownerId });
  if (!device) return next(createHttpError.NotFound("Device Not Found"));
  if (name) device.name = name;
  if (type) device.type = type;
  if (ip) device.ip = ip;
  if (url && url == "remove") device.url = null;
  if (url && url != "remove") device.url = url;
  if (uniqueId) device.uniqueId = uniqueId;
  await device.save();

  res.status(200).json({ success: true, message: "Device updated successfully" });
});

// delete device
// -------------
const deleteDevice = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const ownerId = req.user?._id;
  const deviceId = req?.params?.deviceId;
  const device = await Device.findOneAndDelete({ _id: deviceId, ownerId });
  if (!device) return next(createHttpError.NotFound("Device Not Found"));
  res.status(200).json({ success: true, message: "Device deleted successfully" });
});

// get all devices
// ---------------
const getAllDevices = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const ownerId = req.user?._id;
  const devices = await Device.find({ ownerId }).populate("assignedTo");
  res.status(200).json({ success: true, data: devices });
});

// get device data by unique id
// -------------------------------
const getSingleDeviceLatestData = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const { uniqueId } = req.query;
  const sensors = await Sensor.find({
    payload: { $regex: `\"uniqueId\": \"${uniqueId}\"` },
  });
  if (!sensors || sensors.length === 0) {
    return next(createHttpError.NotFound("Device Not Found"));
  }
  const parsedSensors = sensors.map((sensor: any) => {
    const parsedPayload = JSON.parse(sensor.payload);
    return {
      _id: sensor._id,
      topic: sensor.topic,
      payload: parsedPayload,
      timestamp: parsedPayload.timestamp,
    };
  });
  parsedSensors.sort((a: any, b: any) => b.timestamp - a.timestamp);
  const latestSensor = parsedSensors[0];
  res.status(200).json({ success: true, data: latestSensor });
});

// add sensor data
// ----------------
const addSensorData = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  let { topic, payload } = req.body;
  const sensor = await Sensor.create({ topic, payload: JSON.stringify(payload) });
  res.status(200).json({ success: true, data: "data sended successfully" });
});

export {
  createDevice,
  getSingleDevice,
  deleteDevice,
  getAllDevices,
  updateDevice,
  getSingleDeviceLatestData,
  addSensorData,
};

// {
//     "topic": "fleet/truck_data",
//     "payload": {
//         "uniqueId": "1245678",
//         "ownerId": "666c14e3b9552ffe82c2e144",
//         "truck_id": "truck_7",
//         "timestamp": 1719832884.0254388,
//         "gps": {
//             "latitude": 32.4279,
//             "longitude": 53.6880,
//             "altitude": 809.8577272617125
//         },
//         "speed": 0.15332288466532784,
//         "fuel_level": 69.78690546765293,
//         "engine_temperature": 72.9582570012823,
//         "tire_pressure": {
//             "front_left": 30.591168908883176,
//             "front_right": 30.436918631113077,
//             "rear_left": 31.20862302411171,
//             "rear_right": 32.45954209735951
//         },
//         "battery_voltage": 13.272418955373332,
//         "cargo_temperature": -5.653092866635934,
//         "driver_status": "driving",
//         "route_status": "delayed",
//         "odometer": 625751.9569006935,
//         "acceleration": {
//             "x": 5.673495641340345,
//             "y": -9.121893433694865,
//             "z": 1.6751827668062074
//         },
//         "gyroscope": {
//             "roll": 124.19050837017585,
//             "pitch": 56.28113589145582,
//             "yaw": 97.09270586698909
//         },
//         "maintenance_due": false
//     }
// }
