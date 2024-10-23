import Notification from "../models/notificationModel/notification.model.js";

const addNotificationInDb = async (to: string, type: string, message: string, truckId: string) => {
  try {
    console.log("notification adding");
    if (!to || !type || !message || !truckId) return false;
    const notification = await Notification.create({ to, type, message, truckId });
    return notification;
  } catch (error) {
    console.log("error while sending notification in db", error);
    return false;
  }
};

export { addNotificationInDb };
