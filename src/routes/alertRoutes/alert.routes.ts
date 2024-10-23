import {
  createAlert,
  deleteAlert,
  getAllAlerts,
  updateAlert,
} from "../../controllers/alert/alertController.js";
import { auth, isSiteManager } from "../../middlewares/auth.js";

export const alertRoutes = (app: any) => {
  // create alert
  app.post("/api/alert/create", auth, isSiteManager, createAlert);

  // get all alerts
  app.get("/api/alert/all", auth, isSiteManager, getAllAlerts);

  // update alert
  app.put("/api/alert/single/:alertId", auth, isSiteManager, updateAlert);

  // delete alert
  app.delete("/api/alert/single/:alertId", auth, isSiteManager, deleteAlert);
};
