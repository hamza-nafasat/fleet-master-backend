import mongoose from "mongoose";
import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("fleet_master", "root", "hamzajani.55", {
  host: "localhost",
  dialect: "mysql",
});

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
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};
