import bodyParser from "body-parser";
import {
  addNewSubscription,
  createStripeSession,
  getAllSubscriber,
} from "../../controllers/subscriber/subscriberController.js";
import { auth, isPaymentManager } from "../../middlewares/auth.js";

export const subscriptionRoutes = (app: any) => {
  app.post("/api/subscription/create-session", auth, isPaymentManager, createStripeSession);
  app.post("/api/subscription/webhook", bodyParser.raw({ type: "application/json" }), addNewSubscription);
  app.get("/api/subscription/list", isPaymentManager, getAllSubscriber);
};
