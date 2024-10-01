import mongoose from "mongoose";
import { Sequelize } from "sequelize";
import { config } from "../config/config.js";
import { User } from "../models/userModel/user.model.js";
import { defineSensorData } from "../sequelizeSchemas/schema.js";
const { getEnv } = config;

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
export const connectCustomMySql = async (userId: any) => {
  try {
    const userProfile = await User.findById(userId);
    let dbConnection = sequelize;
    // if user have custom db credentials and custom db setted the connect with custom db
    if (userProfile && userProfile.customDb === true) {
      try {
        const { customDbHost, customDbName, customDbUsername, customDbPassword, customDbPort } =
          userProfile;
        if (customDbHost && customDbName && customDbUsername && customDbPassword && customDbPort) {
          dbConnection = new Sequelize(customDbName, customDbUsername, customDbPassword, {
            host: customDbHost,
            port: customDbPort || 3306,
            dialect: "mysql",
          });
        }
        await dbConnection.authenticate();
        console.log("Connected to custom MySql for user:", userId);
        const SensorData = defineSensorData(dbConnection);
        await dbConnection.sync();
        return { dbConnection, SensorData };
      } catch (error) {
        dbConnection = sequelize;
      }
    }
    await dbConnection.authenticate();
    console.log("Global MySql Database connection established successfully.");
    const SensorData = defineSensorData(dbConnection);
    await dbConnection.sync();
    return { dbConnection, SensorData };
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};
