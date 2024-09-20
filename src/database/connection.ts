import mongoose from "mongoose";
import { Sequelize } from "sequelize";

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
export const sequelize = new Sequelize("sql12732247", "sql12732247", "hcwIdbNd3k", {
  host: "sql12.freesqldatabase.com",
  port: 3306,
  dialect: "mysql",
});
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
