const watchPolygonTrucksData = new Set();
const liveSockets = new Map();
const clientNotificationsSelection = new Map();

const socketEvent = {
  SENSORS_DATA: "SENSORS_DATA",
  WANT_TRACKING_DATA: "WANT_TRACKING_DATA",
  GEOFENCE_TRUCKS_DATA: "GEOFENCE_TRUCKS_DATA",
  NOTIFICATIONS: "NOTIFICATIONS",
};

const findClientNotifications = (userId: string) => {
  return clientNotificationsSelection.get(String(userId));
};
const isInClientNotificationsType = (type: string, notifications: any) => {
  return notifications.some((notification: any) => notification.type === type);
};
const isNotificationOnEmail = (type: string, notifications: any) => {
  return notifications.some(
    (notification: any) => notification.type === type && notification.platform == "email"
  );
};

export {
  liveSockets,
  watchPolygonTrucksData,
  socketEvent,
  clientNotificationsSelection,
  findClientNotifications,
  isInClientNotificationsType,
  isNotificationOnEmail,
};
