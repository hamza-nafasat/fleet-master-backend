import { Sequelize } from "sequelize";
import { app, server as socket } from "./app.js";
import { config } from "./config/config.js";
import { connectDB, connectPostgres } from "./database/connection.js";
import { configureCloudinary } from "./utils/cloudinary.js";
import { notificationWatcher, sensorWatcher } from "./utils/mongoWatcher.js";

// server listen and database connection
(async () => {
  const PORT = config.getEnv("PORT") || 8090;
  try {
    await configureCloudinary();
    // Database connection
    await connectDB(config.getEnv("DATABASE_URL"));
    await connectPostgres();
    // sensor watcher
    sensorWatcher();
    notificationWatcher();
    socket.listen(PORT, () => console.log(`Server running at port ${PORT}`));

    process.on("unhandledRejection", (err: any) => {
      console.log(err);
      console.log("Shutting down the server due to unhandled promise rejection");
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to initialize server", error);
    process.exit(1);
  }
})();
