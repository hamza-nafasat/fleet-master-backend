import mongoose from "mongoose";

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
