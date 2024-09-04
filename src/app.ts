import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import path from "path";
import { Server, Socket } from "socket.io";
import { __dirName } from "./constants/constants.js";
import { isSocketAuth } from "./middlewares/auth.js";
import { Errorhandler } from "./middlewares/errorHandler.js";
import { allApiRoutes } from "./routes/index.routes.js";
import {
  clientNotificationsSelection,
  liveSockets,
  socketEvent,
  watchPolygonTrucksData,
} from "./constants/socketState.js";
import GeoFence from "./models/geoFenceModel/geoFence.model.js";
import bodyParser from "body-parser";
import { Alert } from "./models/alertModel/alert.model.js";

const app = express();
const corsOptions = {
  origin: ["http://localhost:5173", "https://fleet-master-frontend.vercel.app"],
  credentials: true,
};

// middleware
app.use(cors(corsOptions));

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const server = createServer(app);
const io = new Server(server, { cors: corsOptions });
app.set("io", io);

io.use(async (socket: any, next: (err?: Error) => void) => {
  cookieParser()(socket.request as any, socket.request.res as any, async (err) => {
    await isSocketAuth(err, socket, next);
  });
});

io.on("connection", (socket: Socket) => {
  console.log("connected successfully");
  const userRealId = String(socket.user?._id);
  liveSockets.set(userRealId, socket.id);
  console.log("liveSockets", liveSockets);

  // get and add all trucks ids which are in geofences and add them to watchPolygonTrucksData
  GeoFence.find({ startDate: { $lt: new Date() }, endDate: { $gt: new Date() } }).then((geoFences) => {
    const truckIds = geoFences.map((geoFence) => geoFence.trucks.map((truck) => truck.toString()));
    const flattenedTruckIds = truckIds.flat();
    const uniqueTruckIdsSet = new Set(flattenedTruckIds);
    uniqueTruckIdsSet.forEach((id) => watchPolygonTrucksData.add(String(id)));
    console.log("geofence ids", watchPolygonTrucksData);
  });

  // get all alerts user want in notification
  Alert.find({ ownerId: userRealId, status: "enable" }).then((alert) => {
    const modifiedAlerts = alert.map((alert) => {
      return {
        type: alert.type,
        status: alert.status,
        platform: alert.platform,
        severity: alert.severity,
      };
    });
    clientNotificationsSelection.set(userRealId, modifiedAlerts);
    console.log("clientNotificationsSelection", clientNotificationsSelection);
  });

  socket.on(socketEvent.WANT_TRACKING_DATA, (truckIds: string[]) => {
    truckIds.forEach((truckId) => watchPolygonTrucksData.add(String(truckId)));
    console.log("truck ids for send data", watchPolygonTrucksData);
  });

  socket.on("disconnect", () => {
    console.log("disconnected");
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Fleet Backend",
  });
});

app.use(express.static(path.join(__dirName, "../../../public")));
// all api routes
allApiRoutes(app);

// global error handler middleware
app.use(Errorhandler);

export { app, io, server };
