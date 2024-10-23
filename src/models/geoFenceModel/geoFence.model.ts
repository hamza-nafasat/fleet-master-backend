import { Schema, model } from "mongoose";
import { GeoFenceSchemaTypes } from "../../types/geoFence.types.js";

const geoFenceSchema = new Schema<GeoFenceSchemaTypes>(
    {
        ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
        alert: { type: String, enum: ["infence", "outfence"], required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        trucks: { type: [Schema.Types.ObjectId], ref: "Truck", default: [] },
        area: { type: { id: String, coordinates: [] }, default: null },
    },
    { timestamps: true }
);

const GeoFence = model("GeoFence", geoFenceSchema);

export default GeoFence;
