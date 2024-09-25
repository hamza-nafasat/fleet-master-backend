import createHttpError from "http-errors";
import { User } from "../../models/userModel/user.model.js";
import { TryCatch } from "../../utils/tryCatch.js";
import { getDataUri, removeFromCloudinary, uploadOnCloudinary } from "../../utils/cloudinary.js";
import { Request } from "express";
import { UserTypes } from "../../types/userTypes.js";
import bcrypt from "bcrypt";
import { Truck } from "../../models/truckModel/truck.model.js";
import { Driver } from "../../models/driverModel/driver.model.js";
import { Employ } from "../../models/employModel/employ.model.js";
import { Report } from "../../models/reportModel/report.modal.js";
import { Device } from "../../models/deviceModel/device.model.js";
import Notification from "../../models/notificationModel/notification.model.js";
import sensorData from "../../sequelizeSchemas/schema.js";
import { Op } from "sequelize";

// update user profile
//----------------------
const updateUserProfile = TryCatch(async (req: Request<{ userId: string }, {}, UserTypes>, res, next) => {
  // get and validate data
  const { userId } = req.params;
  if (!userId) return next(createHttpError(400, "User Id Not Provided"));
  const image: Express.Multer.File | undefined = req.file;
  const { firstName, lastName, phoneNumber, address, email, password } = req.body;
  if (!image && !firstName && !lastName && !phoneNumber && !address)
    return next(createHttpError(400, "Please Provide at least one field to update"));
  // check user exists
  const user = await User.findById(userId);
  if (!user) return next(createHttpError(404, "User Not Found"));
  // update user fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (address) user.address = address;
  if (email) user.email = email;
  if (password) {
    const hashPassword = await bcrypt.hash(password, 10);
    user.password = hashPassword;
  }
  if (image) {
    // remove old image from cloudinary
    if (user?.image?.public_id) await removeFromCloudinary(user.image.public_id);
    // upload new image on cloudinary
    const fileUrl = getDataUri(image);
    if (!fileUrl.content) return next(createHttpError(400, "Error While Making a Url of user Image"));
    const myCloud = await uploadOnCloudinary(fileUrl.content!, "user");
    if (!myCloud?.public_id || !myCloud?.secure_url)
      return next(createHttpError(400, "Error While Uploading User Image on Cloudinary"));
    user.image = { url: myCloud.secure_url, public_id: myCloud.public_id };
  }
  // update user
  await user.save();
  return res.status(200).json({ success: true, message: "User Updated Successfully", user });
});

// get all users
//---------------
const getAllUsers = TryCatch(async (req, res, next) => {
  const users = await User.find();
  return res.status(200).json({ success: true, users });
});

// delete user
//---------------
const deleteUser = TryCatch(async (req, res, next) => {
  const { userId } = req.params;
  if (!userId) return next(createHttpError(400, "User Id Not Provided"));
  const user = await User.findByIdAndDelete(userId);
  if (!user) return next(createHttpError(404, "User Not Found"));
  // remove image from cloudinary
  if (user?.image?.public_id) await removeFromCloudinary(user.image.public_id);
  // remove user truck drivers and employees
  const [trucks, drivers, employees] = await Promise.all([
    Truck.deleteMany({ ownerId: userId }),
    Driver.deleteMany({ ownerId: userId }),
    Employ.deleteMany({ ownerId: userId }),
  ]);
  if (trucks.deletedCount === 0) return next(createHttpError(400, "Error While Deleting User Trucks"));
  if (drivers.deletedCount === 0) return next(createHttpError(400, "Error While Deleting User Drivers"));
  if (employees.deletedCount === 0)
    return next(createHttpError(400, "Error While Deleting User Employees"));
  return res.status(200).json({ success: true, message: "User Deleted Successfully" });
});

// get single truck reports
//-------------------------
const getSingleTruckReport = TryCatch(async (req, res, next) => {
  const { timeTo, timeFrom, plateNumber } = req.query;

  // Variables for truck details
  let driverName: string | undefined;
  let gpsDevice: string | undefined;
  let truckStatus: string | undefined;
  let truck: any;
  let reportData: any = {};

  // Handle start and end date range
  if (timeFrom) reportData.startDate = new Date(timeFrom);
  if (timeTo) reportData.endDate = new Date(timeTo);

  if (plateNumber) {
    // Find the truck by plate number
    truck = await Truck.findOne({ plateNumber }).populate("assignedTo").populate("devices");
    if (truck) {
      reportData.truck = String(truck._id);
    } else {
      return next(createHttpError(404, "Truck not found. Please provide a correct plate number"));
    }

    driverName = `${truck?.assignedTo?.firstName} ${truck?.assignedTo?.lastName}`;
    gpsDevice = truck?.devices?.find((device: any) => device?.type === "gps")?._id;
    truckStatus = truck?.status;
  }
  // Fetch reports within the specified date range for the given truck
  // Build the query for reports, conditionally applying filters
  let reportQuery: any = {
    where: {
      truckId: reportData.truck,
    },
    order: [["createdAt", "DESC"]],
  };

  // Add date range filter if timeFrom or timeTo is provided
  if (reportData.startDate || reportData.endDate) {
    reportQuery.where.createdAt = {
      ...(reportData.startDate ? { [Op.gte]: reportData.startDate } : {}),
      ...(reportData.endDate ? { [Op.lte]: reportData.endDate } : {}),
    };
  }

  // Fetch reports from the database, with or without truckId and date range filters
  const reports = await sensorData.findAll(reportQuery);

  // Modify the reports to include additional details
  const modifiedReports = await Promise.all(
    reports.map(async (report: any) => {
      return {
        ...report._doc,
        _id: report.id,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        plateNumber: plateNumber,
        driverName: driverName,
        truckStatus: truckStatus,
        deviceId: gpsDevice,
        latitude: report.gps_latitude,
        longitude: report.gps_longitude,
        speed: report.speed,
        truck: truck,
      };
    })
  );
  console.log("modifiedReports", modifiedReports);

  // Send the modified reports as a response
  res.status(200).json({ success: true, data: modifiedReports });
});

// get single truck reports
//-------------------------
const geSingleTruckReport = TryCatch(async (req, res, next) => {
  const { timeTo, timeFrom, plateNumber } = req.query;

  // Create date objects for the query range

  let driverName: any;
  let gpsDevice: any;
  let truckStatus: any;
  const reportData: any = {};
  if (timeFrom) {
    const startDate = new Date(timeFrom);
    reportData["createdAt"] = { $gte: startDate };
  }
  if (timeTo) {
    const endDate = new Date(timeTo);
    reportData["createdAt"] = { $lte: endDate };
  }
  if (plateNumber) {
    // Find the truck by plate number
    const truck: any = await Truck.findOne({ plateNumber }).populate("assignedTo").populate("devices");
    if (!truck) {
      return next(createHttpError(404, "Truck not found. Please provide a correct plate number"));
    }

    driverName = `${truck?.assignedTo?.firstName} ${truck?.assignedTo?.lastName}`;
    gpsDevice = truck?.devices?.find((device: any) => device?.type === "gps")?._id;
    truckStatus = truck?.status;
  }
  // Fetch reports within the specified date range for the given truck
  const reports = await sensorData.findAll({
    where: {
      ...reportData,
    },
    order: [["createdAt", "DESC"]],
    limit: 1,
  });

  // Modify the reports to include additional details
  const modifiedReports = await Promise.all(
    reports.map(async (report: any) => {
      return {
        ...report._doc,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        plateNumber: plateNumber,
        driverName: driverName,
        truckStatus: truckStatus,
        deviceId: gpsDevice,
      };
    })
  );

  // Send the modified reports as a response
  res.status(200).json({ success: true, data: modifiedReports });
});

// get admin dashboard details
const getAdminDashboardDetails = TryCatch(async (req, res, next) => {
  const totalConnectedTrucksPromise = Truck.countDocuments({ status: "connected" });
  const totalNotConnectedTrucksPromise = Truck.countDocuments({ status: "not-connected" });
  const totalTrucksPromise = Truck.countDocuments();
  const totalDriversPromise = Driver.countDocuments();
  const totalEmployeesPromise = Employ.countDocuments();
  const totalDevicesPromise = Device.countDocuments();
  const totalAlarmsPromise = Notification.countDocuments({ isRead: false });

  const [
    totalAssignedTrucks,
    totalUnAssignedTrucks,
    totalTrucks,
    totalDrivers,
    totalEmployees,
    totalDevices,
    totalAlarms,
  ] = await Promise.all([
    totalConnectedTrucksPromise,
    totalNotConnectedTrucksPromise,
    totalTrucksPromise,
    totalDriversPromise,
    totalEmployeesPromise,
    totalDevicesPromise,
    totalAlarmsPromise,
  ]);

  return res.status(200).json({
    success: true,
    data: {
      totalAssignedTrucks,
      totalUnAssignedTrucks,
      totalTrucks,
      totalDrivers,
      totalEmployees,
      totalDevices,
      totalAlarms,
    },
  });
});

export { updateUserProfile, getAllUsers, deleteUser, getSingleTruckReport, getAdminDashboardDetails };
