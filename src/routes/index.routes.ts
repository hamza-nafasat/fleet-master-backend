import { userRoutes } from "./userRoutes/user.routes.js";
import { driverRoutes } from "./driverRoutes/driver.routes.js";
import { employRoutes } from "./employRoutes/employ.routes.js";
import { truckRoutes } from "./truckRoutes/truck.routes.js";
import { adminRoutes } from "./adminRoutes/admin.routes.js";
import { deviceRoutes } from "./deviceRoutes/device.routes.js";
import { geoFneceRoutes } from "./geoFensRoutes/geoFens.routes.js";
import { subscriptionRoutes } from "./subscriptionRoutes/subscription.routes.js";
import { notificationRoutes } from "./notificationRoutes/notification.routes.js";
import { alertRoutes } from "./alertRoutes/alert.routes.js";

export const allApiRoutes = (app: any) => {
  // user routes
  userRoutes(app);

  // driver routes
  driverRoutes(app);

  // create new truck
  truckRoutes(app);

  // user routes
  employRoutes(app);

  // admin routes
  adminRoutes(app);

  // device routes
  deviceRoutes(app);

  // geoFence routes
  geoFneceRoutes(app);

  // subscription routes
  subscriptionRoutes(app);

  // notification routes
  notificationRoutes(app);

  // alert routes
  alertRoutes(app);
};
