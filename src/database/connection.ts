import mongoose from "mongoose";
import { Sequelize } from "sequelize";
import { config } from "../config/config.js";
import { User } from "../models/userModel/user.model.js";
import { defineSensorData } from "../sequelizeSchemas/schema.js";
const { getEnv } = config;

let customDbConnections = {};

const isConnected = async (dbConnection: any) => {
  try {
    await dbConnection.authenticate();
    return true;
  } catch (error) {
    return false;
  }
};

// connect mongodb
// ---------------
export const connectDB = async (dbUrl: string) => {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB successfully");
    mongoose.connection.on("error", () => console.log("Error in connection to database"));
  } catch (error) {
    console.log("Connection failed...", error);
    mongoose.connection.close();
  }
};

// connect mysql
// -------------
export const sequelize = new Sequelize(
  getEnv("SQL_DB_NAME"),
  getEnv("SQL_USERNAME"),
  getEnv("SQL_PASSWORD"),
  {
    host: getEnv("SQL_HOST_NAME"),
    port: Number(getEnv("SQL_PORT")) || 3306,
    dialect: "mysql",
  }
);

// Function to connect to the default or custom MySQL database based on user profile
export const connectCustomMySql = async (userId: any) => {
  try {
    const userProfile = await User.findById(userId);
    let dbConnection = sequelize;
    // if user have custom db credentials and custom db setted the connect with custom db
    if (userProfile && userProfile.customDb === true) {
      const { customDbHost, customDbName, customDbUsername, customDbPassword, customDbPort } = userProfile;
      if (customDbHost && customDbName && customDbUsername && customDbPassword && customDbPort) {
        dbConnection = new Sequelize(customDbName, customDbUsername, customDbPassword, {
          host: customDbHost,
          port: customDbPort || 3306,
          dialect: "mysql",
        });
      }
      console.log("Connecting to custom database for user:", userId);
    } else {
      console.log("Using default database for user:", userId);
    }
    await dbConnection.authenticate();
    console.log("Database connection established successfully.");
    const SensorData = defineSensorData(dbConnection);
    await dbConnection.sync();
    return { dbConnection, SensorData };
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};

// export const connectPostgres = async () => {
//   try {
//     sequelize
//       .authenticate()
//       .then(() => {
//         console.log("Connected to MySQL via Sequelize");
//       })
//       .catch((err) => {
//         console.error("Unable to connect to MySQL:", err);
//       });
//     await sequelize.sync();
//   } catch (error) {
//     console.error("Unable to connect to the database:", error);
//   }
// };
