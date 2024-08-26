import { createAlert } from "../../controllers/alert/alertController.js";
import { auth } from "../../middlewares/auth.js";

export const alertRoutes = (app: any) => {
  // create alert
  app.post("/api/alert/create", auth, createAlert);
};
