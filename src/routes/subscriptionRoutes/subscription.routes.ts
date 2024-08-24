import bodyParser from "body-parser";
import express from "express";
import {
  addNewSubscription,
  createStripeSession,
  getAllSubscriber,
} from "../../controllers/subscriber/subscriberController.js";
import { auth } from "../../middlewares/auth.js";

export const subscriptionRoutes = (app: any) => {
  app.post("/api/subscription/create-session", auth, createStripeSession);
  app.post("/api/subscription/webhook", bodyParser.raw({ type: "application/json" }), addNewSubscription);
  app.get("/api/subscription/list", getAllSubscriber);
};
