const watchPolygonTrucksData = new Set();
const liveSockets = new Map();
const clientNotificationsSelection = new Map();

const notificationSent: any[] = [];

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
  const value = notifications?.find((notification: any) => notification?.type === type);
  if (value) return value;
  else return false;
};
const isNotificationOnEmail = (type: string, notifications: any) => {
  return notifications?.some(
    (notification: any) => notification?.type === type && notification?.platform == "email"
  );
};

const isAlreadySentNotification = (type: string, truckId: string) => {
  console.log("notificationSent", notificationSent);
  const findClientSentNotifications = notificationSent.find(
    (item) => String(item.type) === String(type) && String(item.truckId) === String(truckId)
  );
  if (findClientSentNotifications) return true;
  else return false;
};

const addInSentNotification = (type: string, truckId: string) => {
  console.log("add " + type + "  in notifications ");
  const findClientSentNotifications = notificationSent.find(
    (item) => String(item.type) === String(type) && String(item.truckId) === String(truckId)
  );
  if (!findClientSentNotifications) {
    notificationSent.push({ type, truckId });
    return true;
  } else {
    return false;
  }
};

const removeInSentNotification = (type: string, truckId: string) => {
  console.log("remove " + type + "  from notifications ");

  const findClientSentNotifications = notificationSent.find(
    (item) => String(item.type) === String(type) && String(item.truckId) === String(truckId)
  );
  if (findClientSentNotifications) {
    notificationSent.splice(notificationSent.indexOf(findClientSentNotifications), 1);
    return true;
  } else {
    return false;
  }
};

export {
  liveSockets,
  watchPolygonTrucksData,
  socketEvent,
  clientNotificationsSelection,
  findClientNotifications,
  isInClientNotificationsType,
  isNotificationOnEmail,
  isAlreadySentNotification,
  addInSentNotification,
  removeInSentNotification,
};
