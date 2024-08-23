import mongoose from "mongoose";
import { sensorWatcher } from "../utils/mongoWatcher.js";

export const connectDB = async (dbUrl: string) => {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to database successfully");
        mongoose.connection.on("error", () => console.log("Error in connection to database"));
    } catch (error) {
        console.log("Connection failed...", error);
        process.exit(1);
    }
};
