import {
    deleteSingleNotification,
    getMyAllNotification,
    getMyAllPresentNotifications,
    getSingleNotification,
    readAllNotifications,
    readTheNotification,
} from "../../controllers/notification/notificationController.js";
import { auth } from "../../middlewares/auth.js";

export const notificationRoutes = (app: any) => {
    // get my all present and all notifications
    app.get("/api/notification/new", auth, getMyAllPresentNotifications);
    app.get("/api/notification/all", auth, getMyAllNotification);

    // get single notification
    app.route("/api/notification/single/:notificationId")
        .get(auth, getSingleNotification)
        .delete(auth, deleteSingleNotification);

    // read the notification
    app.put("/api/notification/read/:notificationId", auth, readTheNotification);
    app.put("/api/notifications/read-all", auth, readAllNotifications);
};
