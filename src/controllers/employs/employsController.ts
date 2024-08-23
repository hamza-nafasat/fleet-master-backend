import createHttpError from "http-errors";
import { TryCatch } from "../../utils/tryCatch.js";
import { Request } from "express";
import { getDataUri, removeFromCloudinary, uploadOnCloudinary } from "../../utils/cloudinary.js";
import { isValidObjectId } from "mongoose";
import { Employ } from "../../models/employModel/employ.model.js";
import { EmployTypes, OptionalEmployTypes } from "../../types/employTypes.js";

//-----------------
// create new employ
//-----------------
const createNewEmploy = TryCatch(async (req: Request<{}, {}, EmployTypes>, res, next) => {
    const ownerId = req.user?._id;
    const { firstName, lastName, email, role, phoneNumber } = req.body;
    const image: Express.Multer.File | undefined = req.file;
    if (!image) return next(createHttpError(400, "Image Not Provided!"));
    if (!firstName || !lastName || !email || !role || !phoneNumber)
        return next(createHttpError(400, "All Required fields are Not Provided!"));
    // upload image on cloudinary
    const fileUrl = getDataUri(image);
    if (!fileUrl.content) return next(createHttpError(400, "Error While Making a Url of Employ Image"));
    const myCloud = await uploadOnCloudinary(fileUrl.content!, "employ");
    if (!myCloud?.public_id || !myCloud?.secure_url)
        return next(createHttpError(400, "Error While Uploading Employ Image on Cloudinary"));
    // create a employ
    const employ = await Employ.create({
        ownerId,
        firstName,
        lastName,
        email,
        role,
        phoneNumber,
        image: {
            url: myCloud.secure_url,
            public_id: myCloud.public_id,
        },
    });
    if (!employ) return next(createHttpError(400, "Error While Creating Employ"));
    res.status(201).json({ success: true, message: "Employ Created Successfully" });
});

//----------------
// get all employ
//----------------
const getAllEmployees = TryCatch(async (req, res, next) => {
    const ownerId = req.user?._id;
    const employees = await Employ.find({ ownerId });
    if (!employees) return next(createHttpError(400, "Error While Fetching Employees"));
    res.status(200).json({ success: true, employees });
});

//------------------
// get single Employ
//------------------
const getSingleEmploy = TryCatch(async (req, res, next) => {
    const ownerId = req.user?._id;
    const { employId } = req.params;
    if (!isValidObjectId(employId)) return next(createHttpError(400, "Invalid Employ Id"));
    // get employ
    const employ = await Employ.findOne({ _id: employId, ownerId });
    if (!employ) return next(createHttpError(404, "Employ Not Found"));
    res.status(200).json({ success: true, employ });
});

//-------------------
// update single Employ
//-------------------
const updateSingleEmploy = TryCatch(async (req: Request<any, {}, OptionalEmployTypes>, res, next) => {
    const ownerId = req.user?._id;
    const { employId } = req.params;
    if (!isValidObjectId(employId)) return next(createHttpError(400, "Invalid Employ Id"));
    const { firstName, lastName, email, role, phoneNumber } = req.body;
    const image: Express.Multer.File | undefined = req.file;
    if (!firstName && !lastName && !email && !role && !phoneNumber && !image) {
        return next(createHttpError(400, "All Required fields are Not Provided!"));
    }
    // check employ exist or not
    const employ = await Employ.findOne({ _id: employId, ownerId });
    if (!employ) return next(createHttpError(404, "Employ Not Found"));
    // now update fields according requirements
    if (firstName) employ.firstName = firstName;
    if (lastName) employ.lastName = lastName;
    if (email) employ.email = email;
    if (role) employ.role = role;
    if (phoneNumber) employ.phoneNumber = phoneNumber;
    if (image) {
        // remove old file
        if (employ?.image?.public_id) await removeFromCloudinary(employ.image.public_id);
        // add new file as a profile image
        const fileUrl = getDataUri(image);
        if (!fileUrl.content) return next(createHttpError(400, "Error While Making a Url of Employ Image"));
        const myCloud = await uploadOnCloudinary(fileUrl.content!, "employ");
        if (!myCloud?.public_id || !myCloud?.secure_url)
            return next(createHttpError(400, "Error While Uploading Employ Image on Cloudinary"));
        employ.image = { url: myCloud.secure_url, public_id: myCloud.public_id };
    }
    // update Employ
    const updatedEmploy = await employ.save();
    if (!updatedEmploy) return next(createHttpError(400, "Error While Updating Employ"));
    res.status(200).json({ success: true, message: "Employ Updated Successfully" });
});

//
// delete single employ
//
const deleteSingleEmploy = TryCatch(async (req, res, next) => {
    const ownerId = req.user?._id;
    const { employId } = req.params;
    if (!isValidObjectId(employId)) return next(createHttpError(400, "Invalid Employ Id"));
    // check employ exist or not
    const employ = await Employ.findOneAndDelete({ _id: employId, ownerId }, { new: true });
    if (!employ) return next(createHttpError(404, "Employ Not Found"));
    // remove image from cloudinary
    if (employ?.image?.public_id) await removeFromCloudinary(employ.image.public_id);
    res.status(200).json({ success: true, message: "Employ Deleted Successfully" });
});

export { createNewEmploy, getAllEmployees, getSingleEmploy, updateSingleEmploy, deleteSingleEmploy };
