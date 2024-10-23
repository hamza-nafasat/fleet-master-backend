import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { connectCustomMySql } from "../../database/connection.js";
import { Device } from "../../models/deviceModel/device.model.js";
import Sensor from "../../models/sensorModel/sensor.model.js";
import { DeviceTypes } from "../../types/device.types.js";
import { doneAllFuncOnOneData } from "../../utils/mongoWatcher.js";
import { TryCatch } from "../../utils/tryCatch.js";
import { watchPolygonTrucksData } from "../../constants/socketState.js";
import { config } from "../../config/config.js";

// create device
// -------------
const createDevice = TryCatch(
  async (req: Request<{}, {}, DeviceTypes>, res: Response, next: NextFunction) => {
    const ownerId = req.user?._id;
    const { name, type, ip, uniqueId, url } = req.body;
    if (!name || !type || !ip || !uniqueId)
      return next(createHttpError.BadRequest("All fields are required"));
    if (type === "vide" && !url)
      return next(createHttpError.BadRequest("Url is required for video sensor"));
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

// get user latest device data
// ---------------------------
const getUserLatestDeviceData = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const ownerId = req.user?._id;
  if (!ownerId) return next(createHttpError.BadRequest("ownerId is required"));
  const { SensorData, dbConnection } = await connectCustomMySql(String(ownerId));

  const { truckId, uniqueId } = req.query;
  if (!truckId || !uniqueId) return next(createHttpError.BadRequest("truckId and uniqueId are required"));
  // find data from my sql
  const deviceLatestData = await SensorData.findOne({
    where: {
      truckId: truckId,
      uniqueId: uniqueId,
      ownerId: ownerId,
    },
    order: [["createdAt", "DESC"]],
    limit: 1,
  });
  if (!deviceLatestData) return next(createHttpError.NotFound("Device Not Found"));
  res.status(200).json({ success: true, data: deviceLatestData });
});

// add sensor data
// ----------------
const addSensorData = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  let userId = req?.user?._id;
  if (!userId) return next(createHttpError.BadRequest("Please Login again"));
  const { SensorData, dbConnection } = await connectCustomMySql(String(userId));
  let {
    topic,
    type,
    uniqueId,
    ownerId,
    truckId,
    timestamp,
    gps_latitude,
    gps_longitude,
    gps_altitude,
    speed,
    fuel_level,
    engine_temperature,
    tire_pressure_front_left,
    tire_pressure_front_right,
    tire_pressure_rear_left,
    tire_pressure_rear_right,
    battery_voltage,
    cargo_temperature,
    driver_status,
    route_status,
    odometer,
    acceleration_x,
    acceleration_y,
    acceleration_z,
    gyroscope_roll,
    gyroscope_pitch,
    gyroscope_yaw,
    maintenance_due,
  } = req.body;
  const sensor = await SensorData.create({
    topic,
    type,
    uniqueId,
    ownerId,
    truckId,
    timestamp,
    gps_latitude,
    gps_longitude,
    gps_altitude,
    speed,
    fuel_level,
    engine_temperature,
    tire_pressure_front_left,
    tire_pressure_front_right,
    tire_pressure_rear_left,
    tire_pressure_rear_right,
    battery_voltage,
    cargo_temperature,
    driver_status,
    route_status,
    odometer,
    acceleration_x,
    acceleration_y,
    acceleration_z,
    gyroscope_roll,
    gyroscope_pitch,
    gyroscope_yaw,
    maintenance_due,
  });
  if (!sensor) return next(createHttpError.BadRequest("Sensor Data Not Added"));
  res.status(200).json({ success: true, data: "data sended successfully" });
});

// get user latest device data
// ---------------------------
const getUserLatestDevicesData = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const ownerId = req.user?._id?.toString();
  if (!ownerId) return next(createHttpError.BadRequest("ownerId is required"));
  const { dbConnection, SensorData } = await connectCustomMySql(String(ownerId));
  console.log("data coming from ", dbConnection.config.host);

  // Fetch all devices for this user
  const devicesOfThisUser = await Device.find({
    ownerId: ownerId,
    type: "gps",
    uniqueId: { $exists: true, $ne: null },
    assignedTo: { $exists: true, $ne: null },
  });
  if (!devicesOfThisUser?.length) return next(createHttpError.NotFound("Devices Not Found for this user"));

  // Extract unique IDs and truckIds from the devices
  const uniqueIds = devicesOfThisUser.map((device: any) => device.uniqueId?.toString());
  const truckIds = devicesOfThisUser.map((device: any) => device.assignedTo?.toString());

  // Fetch the latest sensor data for all devices in a single query
  const sensorsOfThisUsersDevices = await SensorData.findAll({
    where: {
      uniqueId: uniqueIds,
      ownerId: ownerId,
      truckId: truckIds,
    },
    order: [["createdAt", "DESC"]],
    limit: 1,
  });

  const doneAllFuncOnOneDataPromises = sensorsOfThisUsersDevices.map(async (device: any) => {
    if (device && device?.uniqueId) await doneAllFuncOnOneData(device);
  });
  // Wait for all async operations to complete
  await Promise.all(doneAllFuncOnOneDataPromises);

  // Map the sensor data back to the devices using uniqueId
  const dataForReturn: any = {};
  const obj = devicesOfThisUser.forEach((device: any) => {
    let latestSensor = sensorsOfThisUsersDevices.find((sensor: any) => {
      return sensor?.uniqueId === device?.uniqueId && watchPolygonTrucksData.has(sensor?.truckId);
    });
    // check if this is created at before 2 min then return null
    if (
      latestSensor?.createdAt <
      new Date(new Date().getTime() - Number(config.getEnv("DAMAGE_SENSOR_TIME")) || 300000)
    ) {
      latestSensor.isOffline = true;
      dataForReturn[device.uniqueId] = latestSensor;
      latestSensor = null;
    } else if (latestSensor) {
      dataForReturn[device.uniqueId] = latestSensor;
    }
  });

  // Return the object with the device unique IDs and latest sensor data
  res.status(200).json({ success: true, data: dataForReturn });
});

export {
  addSensorData,
  createDevice,
  deleteDevice,
  getAllDevices,
  getSingleDevice,
  getSingleDeviceLatestData,
  getUserLatestDeviceData,
  getUserLatestDevicesData,
  updateDevice,
};
