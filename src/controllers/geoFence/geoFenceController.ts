import createHttpError from "http-errors";
import GeoFence from "../../models/geoFenceModel/geoFence.model.js";
import { TryCatch } from "../../utils/tryCatch.js";
import { GeoFenceTypes } from "../../types/geoFence.types.js";
import { Request } from "express";
import { isValidObjectId } from "mongoose";
import { Truck } from "../../models/truckModel/truck.model.js";
import { watchPolygonTrucksData } from "../../constants/socketState.js";

const createGeoFence = TryCatch(async (req: Request<{}, {}, GeoFenceTypes>, res, next) => {
  const ownerId = req.user?._id;
  console.log(ownerId);
  const { name, status, startDate, endDate, alert } = req.body;
  if (!name || !status || !startDate || !endDate)
    return next(createHttpError(400, "All Required fields are Not Provided!"));
  // create GeoFence
  const geoFence = await GeoFence.create({
    ownerId,
    name,
    status,
    startDate,
    alert,
    endDate,
  });
  res.status(201).json({ success: true, message: "GeoFence Created Successfully" });
});

const getSingleGeoFence = TryCatch(async (req: Request, res, next) => {
  const ownerId = req.user?._id;
  const geoFenceId = req?.params?.geoFenceId;
  if (!isValidObjectId(geoFenceId)) return next(createHttpError(400, "Invalid GeoFence Id"));
  const geoFence = await GeoFence.findOne({ _id: geoFenceId, ownerId }).populate({
    path: "trucks",
    populate: [
      { path: "devices", select: "type" },
      { path: "assignedTo", select: "firstName lastName" },
    ],
  });
  if (!geoFence) return next(createHttpError(404, "GeoFence Not Found"));
  res.status(200).json({ success: true, geoFence });
});

const updateSingleGeoFences = TryCatch(async (req: Request, res, next) => {
  const ownerId = req.user?._id;
  const geoFenceId = req?.params?.geoFenceId;
  if (!isValidObjectId(geoFenceId)) return next(createHttpError(400, "Invalid GeoFence Id"));
  const { name, status, startDate, endDate, alert, area } = req.body;
  if (!name && !status && !startDate && !endDate && !alert)
    return next(createHttpError(400, "All Required fields are Not Provided!"));
  const geoFence = await GeoFence.findOneAndUpdate(
    { _id: geoFenceId, ownerId },
    { name, status, startDate, endDate, alert, area },
    { new: true }
  );
  if (!geoFence) return next(createHttpError(404, "GeoFence Not Found"));
  res.status(200).json({ success: true, message: "GeoFence Updated Successfully" });
});

const deleteSingleGeoFence = TryCatch(async (req: Request, res, next) => {
  const ownerId = req.user?._id;
  const geoFenceId = req?.params?.geoFenceId;
  if (!isValidObjectId(geoFenceId)) return next(createHttpError(400, "Invalid GeoFence Id"));
  const geoFence = await GeoFence.findOneAndDelete({ _id: geoFenceId, ownerId });
  if (!geoFence) return next(createHttpError(404, "GeoFence Not Found"));

  // add trucks in watchPolygonTrucksData
  console.log("before", watchPolygonTrucksData);
  geoFence?.trucks.forEach((truckId: any) => watchPolygonTrucksData.delete(String(truckId)));
  console.log("after", watchPolygonTrucksData);

  res.status(200).json({ success: true, message: "GeoFence Deleted Successfully" });
});

const addTruckAndArea = TryCatch(async (req: Request, res, next) => {
  const ownerId = req.user?._id;
  const geoFenceId = req?.params?.geoFenceId;
  if (!isValidObjectId(geoFenceId)) return next(createHttpError(400, "Invalid GeoFence Id"));
  const { trucks = [], area = [] } = req.body;
  // if (trucks.length === 0) return next(createHttpError(400, "Trucks Not Provided"));
  if (area.length === 0) return next(createHttpError(400, "Area Not Provided"));
  const geoFence = await GeoFence.findOne({ _id: geoFenceId, ownerId });
  if (!geoFence) return next(createHttpError(404, "GeoFence Not Found"));
  // validate trucks
  const trucksExistsPromises = trucks.map(async (truckId: string) => {
    if (!isValidObjectId(truckId)) return next(createHttpError(400, "Invalid Truck Id in Trucks Array"));
    return Truck.exists({ _id: truckId, ownerId });
  });
  const trucksExists = await Promise.all(trucksExistsPromises);

  if (trucksExists.includes(false)) return next(createHttpError(404, "Some Trucks Not Found"));
  geoFence.trucks = trucks as any;
  geoFence.area = area;
  await geoFence.save();

  // add trucks in watchPolygonTrucksData
  console.log("before", watchPolygonTrucksData);
  trucks.forEach((truckId: any) => watchPolygonTrucksData.add(String(truckId)));
  console.log("after", watchPolygonTrucksData);

  res.status(200).json({ success: true, message: "Trucks Updated Successfully" });
});

const removeTruckFromGeoFence = TryCatch(async (req: Request, res, next) => {
  const ownerId = req.user?._id;
  const geoFenceId = req?.params?.geoFenceId;
  if (!isValidObjectId(geoFenceId)) return next(createHttpError(400, "Invalid GeoFence Id"));
  const { truckId } = req.body;
  if (!isValidObjectId(truckId)) return next(createHttpError(400, "Invalid Truck Id"));
  const geoFence = await GeoFence.findOne({ _id: geoFenceId, ownerId });
  if (!geoFence) return next(createHttpError(404, "GeoFence Not Found"));
  geoFence.trucks = geoFence.trucks.filter((truck) => truck.toString() !== String(truckId));
  await geoFence.save();

  // remove truck from watchPolygonTrucksData
  console.log("before", watchPolygonTrucksData);
  watchPolygonTrucksData.delete(String(truckId));
  console.log("after", watchPolygonTrucksData);
  res.status(200).json({ success: true, message: "Trucks Removed Successfully Successfully" });
});

const getAllGeoFences = TryCatch(async (req: Request, res, next) => {
  const ownerId = req.user?._id;
  const geoFences = await GeoFence.find({ ownerId }).populate("trucks");
  res.status(200).json({ success: true, geoFences });
});

export {
  createGeoFence,
  getSingleGeoFence,
  updateSingleGeoFences,
  deleteSingleGeoFence,
  addTruckAndArea,
  getAllGeoFences,
  removeTruckFromGeoFence,
};
