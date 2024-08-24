import {
  deleteUser,
  getAdminDashboardDetails,
  getAllUsers,
  getSingleTruckReport,
  updateUserProfile,
} from "../../controllers/admin/adminController.js";
import { auth, isAdmin } from "../../middlewares/auth.js";
import { singleUpload } from "../../middlewares/multer.js";

export const adminRoutes = (app: any) => {
  // update user profile
  app.put("/api/admin/user-profile/:userId", auth, isAdmin, singleUpload, updateUserProfile);

  // get all users
  app.get("/api/admin/users", auth, isAdmin, getAllUsers);

  // delete user
  app.delete("/api/admin/user/:userId", auth, isAdmin, deleteUser);

  // get single truck reports
  app.get("/api/admin/truck-reports", auth, isAdmin, getSingleTruckReport);

  // get admin dashboard details
  app.get("/api/admin/dashboard/details", auth, isAdmin, getAdminDashboardDetails);
};
