import { getAdminDashboardDetails, getSingleTruckReport } from "../../controllers/admin/adminController.js";
import { auth, isAnyAuthUser, isReportsManager } from "../../middlewares/auth.js";

export const adminRoutes = (app: any) => {
  // // update user profile
  // app.put("/api/admin/user-profile/:userId", auth, isAdmin, singleUpload, updateUserProfile);
  // // get all users
  // app.get("/api/admin/users", auth, isAdmin, getAllUsers);
  // // delete user
  // app.delete("/api/admin/user/:userId", auth, isAdmin, deleteUser);

  // get single truck reports
  app.get("/api/admin/truck-reports", auth, isReportsManager, getSingleTruckReport);

  // get admin dashboard details
  app.get("/api/admin/dashboard/details", auth, isAnyAuthUser, getAdminDashboardDetails);
};
