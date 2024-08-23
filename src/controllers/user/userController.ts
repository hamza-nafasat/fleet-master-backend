import bcrypt from "bcrypt";
import { Request } from "express";
import createHttpError from "http-errors";
import path from "path";
import { config } from "../../config/config.js";
import { __dirName, accessTokenOptions, refreshTokenOptions } from "../../constants/costants.js";
import { JWTService } from "../../services/jwtToken.js";
import { sendMail } from "../../services/sendMail.js";
import { UserTypes } from "../../types/userTypes.js";
import { TryCatch } from "../../utils/tryCatch.js";
import { User } from "../../models/userModel/user.model.js";
import { getDataUri, uploadOnCloudinary } from "../../utils/cloudinary.js";

//--------------------
// register controller
//--------------------
const register = TryCatch(async (req: Request<{}, {}, UserTypes>, res, next) => {
    // get all body data and validate
    const { firstName, lastName, email, address, phoneNumber, password } = req.body;
    const image: Express.Multer.File | undefined = req.file;
    console.log("req.file ", req.file);
    if (!image) return next(createHttpError(400, "Please Upload Profile Image"));
    // check user email is already exists
    const emailExists = await User.exists({ email });
    if (emailExists) return next(createHttpError(400, "Email Already Exists"));
    // upload image on cloudinary
    const fileUrl = getDataUri(image);
    if (!fileUrl.content) return next(createHttpError(400, "Error While Making a Url of user Image"));
    const myCloud = await uploadOnCloudinary(fileUrl.content!, "user");
    if (!myCloud?.public_id || !myCloud?.secure_url)
        return next(createHttpError(400, "Error While Uploading User Image on Cloudinary"));
    // create user
    const hashPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        firstName,
        lastName,
        phoneNumber,
        address,
        email,
        image: { url: myCloud.secure_url, public_id: myCloud.public_id },
        password: hashPassword,
    });
    if (!user) return next(createHttpError(400, "Some Error While Creating User"));
    // create verification url and send mail to user for verification
    const verificationToken = await JWTService().createVerificationToken(String(user._id));
    const backendUrl: string = config.getEnv("SERVER_URL");
    const verificationUrl = `${backendUrl}/api/user/verify?token=${verificationToken}`;
    const message = `
    <html>
    <head>
        <title>Email Verification</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 10px;
                background-color: #fff;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            h2 {
                color: #007BFF;
                text-align: center;
            }
            p {
                font-size: 16px;
                margin-bottom: 20px;
                text-align: center;
            }
            .button {
                display: block;
                width: 200px;
                margin: 20px auto;
                padding: 15px;
                font-size: 16px;
                color: white !important;
                background-color: #007BFF;
                text-align: center;
                text-decoration: none;
                border-radius: 5px;
                transition: background-color 0.3s;
            }
            .button:hover {
                background-color: #0056b3;
            }
            .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 12px;
                color: #aaa;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Welcome To Fleet Management, ${firstName} ${lastName}!</h2>
            <p>Thank you for registering. Please click the button below to verify your email address:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <div class="footer">
                <p>&copy; 2024 Fleet Management. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
    const isMailSent = await sendMail(user?.email, "Email Verification", message, true);
    if (!isMailSent) {
        await User.findByIdAndDelete(user._id);
        return next(createHttpError(500, "Please Enter a Valid Email Address and Try Again"));
    }
    // make and store access and refresh token in cookies
    const accessToken = await JWTService().accessToken(String(user._id));
    const refreshToken = await JWTService().refreshToken(String(user._id));
    await JWTService().storeRefreshToken(String(refreshToken));
    res.cookie("accessToken", accessToken, accessTokenOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenOptions);
    return res
        .status(201)
        .json({ message: "A Verification Url is Sent to Your Email. Please Verify Your Account First" });
});
//--------------------
// VERIFY REGISTRATION
//--------------------
const verifyRegistration = TryCatch(async (req: Request<{}, {}, { token: string }>, res, next) => {
    const verificationToken: string = req.query?.token as string;
    if (!verificationToken) return next(createHttpError(400, "Please Provide Verification Token"));
    let decodedToken: any;
    try {
        decodedToken = await JWTService().verifyAccessToken(verificationToken);
    } catch (err) {
        return res.status(400).sendFile(path.join(__dirName, "../../../public/verificationFailed.html"));
    }
    // find user and verify token
    const user = await User.findById(decodedToken);
    if (!user)
        return res.status(400).sendFile(path.join(__dirName, "../../../public/verificationFailed.html"));

    user.isVerified = true;
    // update user
    await user.save();
    res.status(200).sendFile(path.join(__dirName, "../../../public/verifiedSuccess.html"));
});
// --------------------------
// get verification url again
// --------------------------

const getVerificationUrlAgain = TryCatch(async (req, res, next) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return next(createHttpError(401, "Please Login First"));
    let decodedToken: any;
    try {
        decodedToken = await JWTService().verifyRefreshToken(refreshToken);
    } catch (err) {
        return next(createHttpError(401, "Please Login First"));
    }
    // find user
    const userId = decodedToken?._id;
    if (!userId) return next(createHttpError(401, "Please Login First"));
    const user = await User.findById(userId);
    if (!user) return next(createHttpError(404, "User Not Found"));
    if (user?.isVerified) return next(createHttpError(400, "User Already Verified"));
    // create verification url and send mail to user for verification
    const verificationToken = await JWTService().createVerificationToken(String(user._id));
    const backendUrl: string = config.getEnv("SERVER_URL");
    const verificationUrl = `${backendUrl}/api/user/verify?token=${verificationToken}`;
    const message = `
    <html>
    <head>
        <title>Email Verification</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 10px;
                background-color: #fff;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            h2 {
                color: #007BFF;
                text-align: center;
            }
            p {
                font-size: 16px;
                margin-bottom: 20px;
                text-align: center;
            }
            .button {
                display: block;
                width: 200px;
                margin: 20px auto;
                padding: 15px;
                font-size: 16px;
                color: white !important;
                background-color: #007BFF;
                text-align: center;
                text-decoration: none;
                border-radius: 5px;
                transition: background-color 0.3s;
            }
            .button:hover {
                background-color: #0056b3;
            }
            .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 12px;
                color: #aaa;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Welcome To Fleet Management, ${user?.firstName} ${user?.lastName}!</h2>
            <p>Thank you for registering. Please click the button below to verify your email address:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <div class="footer">
                <p>&copy; 2024 Fleet Management. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
    const isMailSent = await sendMail(user?.email, "Email Verification", message, true);
    if (!isMailSent) {
        return next(createHttpError(500, "Please Enter a Valid Email Address and Try Again"));
    }
    return res.status(200).json({ success: true, message: "A Verification Url is Sent to Your Email" });
});
//----------
// login
//----------
const login = TryCatch(async (req, res, next) => {
    // get all body data
    const { email, password } = req.body;
    // match user
    const user = await User.findOne({ email });
    if (user) {
        // compare password
        const matchPwd = await bcrypt.compare(password, user.password);
        if (!matchPwd) return next(createHttpError(400, "Wrong username or password"));
        // make and store access and refresh token in cookies
        const accessToken = await JWTService().accessToken(String(user._id));
        const refreshToken = await JWTService().refreshToken(String(user._id));
        await JWTService().storeRefreshToken(String(refreshToken));
        res.cookie("accessToken", accessToken, accessTokenOptions);
        res.cookie("refreshToken", refreshToken, refreshTokenOptions);
        return res.status(200).json({
            success: true,
            message: "You are logged in successfully",
            data: user,
        });
    }
    return res.status(400).json({ success: false, message: "oops please signup" });
});
//---------------
// get my profile
//---------------
const getMyProfile = TryCatch(async (req, res, next) => {
    const userId = req.user?._id;
    const user = await User.findById(userId).populate("subscriptionId");
    if (!user) return next(createHttpError(404, "User Not Found"));
    return res.status(200).json({ success: true, user });
});
//---------
// logout
//---------
const logout = TryCatch(async (req, res, next) => {
    await JWTService().removeRefreshToken(String(req?.cookies?.refreshToken));
    res.cookie("accessToken", null, { ...accessTokenOptions, maxAge: 0 });
    res.cookie("refreshToken", null, { ...refreshTokenOptions, maxAge: 0 });
    res.status(200).json({ success: true, message: "Logout Successfully" });
});
//-----------------
// FORGET PASSWORD
//----------------
const forgetPassword = TryCatch(async (req, res, next) => {
    const { email } = req.body;
    if (!email) return next(createHttpError(400, "Please Provide Email"));
    // find user
    const user = await User.findOne({ email });
    if (!user) return next(createHttpError(404, "Please Provide Correct Email"));
    // send mail
    const resetPasswordUrl = config.getEnv("RESET_PASSWORD_URL");
    const resetToken = await JWTService().accessToken(String(user._id));
    const message = `Your Reset Password Link: ${resetPasswordUrl}/${resetToken}`;
    const isMailSent = await sendMail(email, "Reset Password", message);
    if (!isMailSent) return next(createHttpError(500, "Some Error Occurred While Sending Mail"));
    res.status(200).json({
        success: true,
        message: "Reset Password Token sent to your email",
    });
});
//---------------
// RESET PASSWORD
//---------------
const resetPassword = TryCatch(async (req, res, next) => {
    const resetToken: string = req.query?.resetToken as string;
    const { newPassword } = req.body;
    if (!resetToken || !newPassword) return next(createHttpError(400, "Token and New Password are required"));
    let verifiedToken: any;
    try {
        verifiedToken = await JWTService().verifyAccessToken(resetToken);
    } catch (err) {
        return res.status(400).sendFile(path.join(__dirName, "../../public/verificationFailed.html"));
    }
    const user = await User.findById(verifiedToken).select("+password");
    if (!user) return next(createHttpError(404, "Invalid or Expired Token"));
    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    await user.save();
    res.status(200).json({ success: true, message: "Password Reset Successfully" });
});
//----------------------
// get new access token
//----------------------
const getNewAccessToken = TryCatch(async (req, res, next) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return next(createHttpError(401, "Please Login Again"));
    let verifyToken: any;
    try {
        verifyToken = await JWTService().verifyRefreshToken(refreshToken);
    } catch (err) {
        return next(createHttpError(401, "Please Login Again"));
    }
    if (verifyToken) {
        const user = await User.findById(verifyToken._id);
        if (!user) return next(createHttpError(401, "Please Login Again"));
        const newAccessToken = await JWTService().accessToken(String(user._id));
        const newRefreshToken = await JWTService().refreshToken(String(user._id));
        // remove old Refresh Token and save new refresh token
        await Promise.all([
            JWTService().removeRefreshToken(String(refreshToken)),
            JWTService().storeRefreshToken(String(newRefreshToken)),
        ]);
        res.cookie("accessToken", newAccessToken, accessTokenOptions);
        res.cookie("refreshToken", newRefreshToken, refreshTokenOptions);
        res.status(200).json({ success: true, message: "New Authentication Created SuccessFully" });
    }
});

export {
    forgetPassword,
    login,
    logout,
    register,
    resetPassword,
    getVerificationUrlAgain,
    verifyRegistration,
    getNewAccessToken,
    getMyProfile,
};
