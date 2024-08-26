import Notification from "../models/notificationModel/notification.model.js";

const addNotificationInDb = async (to: string, type: string, message: string) => {
  try {
    console.log("notification adding");
    if (!to || !type || !message) return false;
    const notification = await Notification.create({ to, type, message });
    return notification;
  } catch (error) {
    console.log("error while sending notification in db", error);
    return false;
  }
};

export { addNotificationInDb };
