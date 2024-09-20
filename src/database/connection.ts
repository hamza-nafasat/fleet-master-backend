import mongoose from "mongoose";
import { Sequelize } from "sequelize";
import { config } from "../config/config.js";
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
export const connectPostgres = async () => {
  try {
    sequelize
      .authenticate()
      .then(() => {
        console.log("Connected to MySQL via Sequelize");
      })
      .catch((err) => {
        console.error("Unable to connect to MySQL:", err);
      });
    await sequelize.sync({ force: false });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};
