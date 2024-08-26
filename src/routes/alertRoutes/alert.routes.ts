import {
  createAlert,
  deleteAlert,
  getAllAlerts,
  updateAlert,
} from "../../controllers/alert/alertController.js";
import { auth } from "../../middlewares/auth.js";

export const alertRoutes = (app: any) => {
  // create alert
  app.post("/api/alert/create", auth, createAlert);

  // get all alerts
  app.get("/api/alert/all", auth, getAllAlerts);

  // update alert
  app.put("/api/alert/single/:alertId", auth, updateAlert);

  // delete alert
  app.delete("/api/alert/single/:alertId", auth, deleteAlert);
};
