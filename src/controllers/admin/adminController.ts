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
  if (employees.deletedCount === 0) return next(createHttpError(400, "Error While Deleting User Employees"));
  return res.status(200).json({ success: true, message: "User Deleted Successfully" });
});

// get single truck reports
//-------------------------
const getSingleTruckReport = TryCatch(async (req, res, next) => {
  const { timeTo, timeFrom, plateNumber } = req.query;

  if (!timeTo || !timeFrom || !plateNumber) {
    return next(createHttpError(400, "Please provide all fields"));
  }

  // Create date objects for the query range
  const startDate = new Date(timeFrom);
  const endDate = new Date(timeTo);

  console.log(startDate, endDate);
  if (startDate > endDate) {
    return next(createHttpError(400, "Start date cannot be greater than end date"));
  }

  // Find the truck by plate number
  const truck: any = await Truck.findOne({ plateNumber }).populate("assignedTo").populate("devices");
  if (!truck) {
    return next(createHttpError(404, "Truck not found. Please provide a correct plate number"));
  }
  const driverName = `${truck?.assignedTo?.firstName} ${truck?.assignedTo?.lastName}`;
  const gpsDevice = truck?.devices?.find((device: any) => device?.type === "gps")?._id;
  const truckStatus = truck?.status;

  // Fetch reports within the specified date range for the given truck
  const reports = await Report.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
    truck: truck._id,
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

export { updateUserProfile, getAllUsers, deleteUser, getSingleTruckReport };
