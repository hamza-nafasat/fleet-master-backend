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

//----------------------
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

//---------------
// get all users
//---------------
const getAllUsers = TryCatch(async (req, res, next) => {
    const users = await User.find();
    return res.status(200).json({ success: true, users });
});

//---------------
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

export { updateUserProfile, getAllUsers, deleteUser };
