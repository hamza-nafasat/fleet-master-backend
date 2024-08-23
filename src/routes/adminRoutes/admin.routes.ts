import { deleteUser, getAllUsers, updateUserProfile } from "../../controllers/admin/adminController.js";
import { auth, isAdmin } from "../../middlewares/auth.js";
import { singleUpload } from "../../middlewares/multer.js";

export const adminRoutes = (app: any) => {
    // update user profile
    app.put("/api/admin/user-profile/:userId", auth, isAdmin, singleUpload, updateUserProfile);

    // get all users
    app.get("/api/admin/users", auth, isAdmin, getAllUsers);

    // delete user
    app.delete("/api/admin/user/:userId", auth, isAdmin, deleteUser);
};
