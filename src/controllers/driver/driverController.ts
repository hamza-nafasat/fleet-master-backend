import { Request } from "express";
import createHttpError from "http-errors";
import { isValidObjectId } from "mongoose";
import { Driver } from "../../models/driverModel/driver.model.js";
import { Truck } from "../../models/truckModel/truck.model.js";
import { DriverTypes, OptionalDriverTypes } from "../../types/driverTypes.js";
import { getDataUri, removeFromCloudinary, uploadOnCloudinary } from "../../utils/cloudinary.js";
import { TryCatch } from "../../utils/tryCatch.js";
import { addNotificationInDb } from "../../utils/addNotification.js";

//
// Create a Driver
//
const createNewDriver = TryCatch(async (req: Request<{}, {}, DriverTypes>, res, next) => {
  const ownerId = req.user?._id;
  if (!ownerId) return next(createHttpError(400, "Please Login to create a Driver"));

  // get data and validate
  const { firstName, fleetNumber, lastName, licenseExpiry, phoneNumber, assignedTruck } = req.body;
  const image: Express.Multer.File | undefined = req.file;
  if (!image) return next(createHttpError(400, "Image Not Provided!"));
  console.log(req.body);
  // check if truck is available
  if (assignedTruck) {
    if (!isValidObjectId(assignedTruck)) return next(createHttpError(400, "Invalid Truck Id"));
    const isTruckAvailable = await Truck.findOne({ _id: assignedTruck, ownerId });
    if (!isTruckAvailable) return next(createHttpError(400, "Truck Not Found"));
    if (isTruckAvailable.status === "connected")
      return next(createHttpError(400, "Truck is already connected to a driver"));
  }

  // upload image in cloudinary
  const fileUrl = getDataUri(image);
  if (!fileUrl.content) return next(createHttpError(400, "Error While Making a Url of File"));
  const myCloud = await uploadOnCloudinary(fileUrl.content!, "drivers");
  if (!myCloud?.public_id || !myCloud?.secure_url)
    return next(createHttpError(400, "Error While Uploading Image on Cloudinary"));

  // create driver and assigned truck if assignedTruck is provided
  let driver;
  let truck;
  if (assignedTruck) {
    // create a driver and assign truck
    driver = await Driver.create({
      ownerId,
      firstName,
      fleetNumber,
      lastName,
      assignedTruck,
      licenseExpiry,
      phoneNumber,
      image: {
        url: myCloud.secure_url,
        public_id: myCloud.public_id,
      },
    });
    // update truck with driver id and status
    truck = await Truck.findOneAndUpdate(
      { _id: assignedTruck, ownerId },
      { $set: { assignedTo: driver._id, status: "connected" } }
    );
  } else {
    // create only driver
    driver = await Driver.create({
      ownerId,
      firstName,
      fleetNumber,
      lastName,
      licenseExpiry,
      phoneNumber,
      image: {
        url: myCloud.secure_url,
        public_id: myCloud.public_id,
      },
    });
  }
  if (!driver) return next(createHttpError(400, "Error While Creating Driver"));
  res.status(201).json({ success: true, message: "Driver Created Successfully" });
});
//
// get all drivers
//
const getAllDrivers = TryCatch(async (req, res, next) => {
  const ownerId = req.user?._id;
  if (!ownerId) return next(createHttpError(400, "Please Login to get Drivers"));
  const drivers: any = await Driver.find({ ownerId: ownerId }).populate("assignedTruck");
  if (!drivers || drivers.length === 0) return next(createHttpError(400, "Error While Fetching Drivers"));
  res.status(200).json({ success: true, drivers: drivers });
});

//
// get single drive
//
const getSingleDriver = TryCatch(async (req, res, next) => {
  const { ownerId } = req.user;
  if (!ownerId) return next(createHttpError(400, "Please Login to get Drivers"));
  const { driverId } = req.params;
  if (!isValidObjectId(driverId)) return next(createHttpError(400, "Invalid Driver Id"));
  // get driver
  const driver = await Driver.findOne({ _id: driverId, ownerId });
  if (!driver) return next(createHttpError(404, "Driver Not Found"));
  res.status(200).json({ success: true, driver });
});

//
// update driver
//
const updateDriver = TryCatch(async (req: Request<any, {}, OptionalDriverTypes>, res, next) => {
  const ownerId = req.user?._id;
  if (!ownerId) return next(createHttpError(400, "Please Login to update Drivers"));
  const { driverId } = req.params;
  if (!isValidObjectId(driverId)) return next(createHttpError(400, "Invalid Driver Id"));

  // get data and validate
  const { firstName, fleetNumber, lastName, licenseExpiry, phoneNumber, assignedTruck, removeAssignedTruck } =
    req.body;
  const image: Express.Multer.File | undefined = req.file;
  if (
    !firstName &&
    !fleetNumber &&
    !lastName &&
    !licenseExpiry &&
    !phoneNumber &&
    !image &&
    !assignedTruck &&
    !removeAssignedTruck
  )
    return next(createHttpError(400, "Please add Something to Update"));

  // get driver
  const driver = await Driver.findOne({ _id: driverId, ownerId });
  if (!driver) return next(createHttpError(404, "Driver Not Found"));

  // check if truck is available if assigned truck is givin
  let truck;
  if (assignedTruck) {
    const isExist = await Truck.findOne({ _id: assignedTruck, ownerId });
    if (!isExist) return next(createHttpError(400, "Truck Not Found"));
    if (isExist.status === "connected")
      return next(createHttpError(400, "Truck is already connected to a driver"));
    // update truck with driver id and status if available
    truck = await Truck.findOneAndUpdate(
      { _id: assignedTruck, ownerId },
      { $set: { assignedTo: driver._id, status: "connected" } },
      { new: true }
    );
    if (!truck) return next(createHttpError(400, "Error While Connecting Truck"));
  } else if (removeAssignedTruck) {
    // check is this truck assigned to any drive
    const isTruckAssigned = await Driver.exists({ assignedTruck: removeAssignedTruck, ownerId });
    if (!isTruckAssigned) return next(createHttpError(404, "Truck Not Assigned to Any Driver"));
    // remove truck assignment from driver
    await Driver.findByIdAndUpdate(isTruckAssigned._id, { assignedTruck: null });
    // remove assignment from truck
    await Truck.findByIdAndUpdate(removeAssignedTruck, { assignedTo: null, status: "not-connected" });
  }

  // assign and remove truck
  if (assignedTruck) {
    driver.assignedTruck = assignedTruck;
  } else if (removeAssignedTruck) {
    driver.assignedTruck = null;
  }

  // update driver
  if (firstName) driver.firstName = firstName;
  if (lastName) driver.lastName = lastName;
  if (fleetNumber) driver.fleetNumber = fleetNumber;
  if (licenseExpiry) driver.licenseExpiry = licenseExpiry;
  if (phoneNumber) driver.phoneNumber = phoneNumber;
  if (image) {
    // remove old file
    if (driver?.image?.public_id) await removeFromCloudinary(driver.image.public_id);
    // add new file as a profile image
    const fileUrl = getDataUri(image);
    if (!fileUrl.content) return next(createHttpError(400, "Error While Making a Url of File"));
    const myCloud = await uploadOnCloudinary(fileUrl.content!, "drivers");
    if (!myCloud?.public_id || !myCloud?.secure_url)
      return next(createHttpError(400, "Error While Uploading Image on Cloudinary"));
    // update driver data with new image
    driver.image.url = myCloud.secure_url;
    driver.image.public_id = myCloud.public_id;
  }

  // save updated driver
  const updatedDriver = await driver.save();
  if (!updatedDriver) return next(createHttpError(400, "Error While Updating Driver"));
  res.status(200).json({
    success: true,
    message: "Driver Updated Successfully",
    updatedDriver,
  });
});

//
// delete driver
//
const deleteDriver = TryCatch(async (req, res, next) => {
  const ownerId = req.user?._id;
  if (!ownerId) return next(createHttpError(400, "Please Login to get Drivers"));
  const { driverId } = req.params;
  if (!isValidObjectId(driverId)) return next(createHttpError(400, "Invalid Driver Id"));

  // get driver and delete
  const driver = await Driver.findOneAndDelete({ _id: driverId, ownerId });
  if (!driver) return next(createHttpError(404, "Driver Not Found"));

  // remove image from cloudinary
  if (driver?.image?.public_id) await removeFromCloudinary(driver.image.public_id);

  res.status(200).json({ success: true, message: "Driver Deleted Successfully" });
});

export { createNewDriver, deleteDriver, getAllDrivers, getSingleDriver, updateDriver };
