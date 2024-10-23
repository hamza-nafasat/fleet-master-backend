import { Schema, model } from "mongoose";

const sensorSchema = new Schema({}, { strict: false });

const Sensor = model("Sensor", sensorSchema, "sensors");

export default Sensor;
