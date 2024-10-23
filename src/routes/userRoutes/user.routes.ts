import {
  forgetPassword,
  getMyProfile,
  getVerificationUrlAgain,
  login,
  logout,
  register,
  resetPassword,
  updateMyProfile,
  verifyRegistration,
} from "../../controllers/user/userController.js";
import { auth } from "../../middlewares/auth.js";
import { singleUpload } from "../../middlewares/multer.js";
import handleValidatorError from "../../middlewares/validationHandler.js";
import {
  forgetPasswordSanitizer,
  loginSanitizer,
  registerSanitizer,
} from "../../validation/user.validation.js";

export const userRoutes = (app: any) => {
  // register user
  app.post("/api/user/register", singleUpload, registerSanitizer, handleValidatorError, register);

  app.get("/api/user/verification-url", auth, getVerificationUrlAgain);
  // login user
  app.post("/api/user/login", login);

  // logout user
  app.get("/api/user/logout", auth, logout);

  // get my profile
  app.get("/api/user/profile", auth, getMyProfile);
  app.put("/api/user/profile", auth, singleUpload, updateMyProfile);

  // verify registration
  app.get("/api/user/verify", verifyRegistration);

  // forget password
  app.put("/api/user/forget-password", forgetPasswordSanitizer, handleValidatorError, forgetPassword);

  // reset password
  app.post("/api/user/reset-password", resetPassword);
};
