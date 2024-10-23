import { ObjectId } from "mongoose";

interface GeoFenceTypes {
    name: string;
    status: string;
    startDate: Date;
    endDate: Date;
    alert: string;
    area: { id: string; coordinates: number[] } | null;
}

interface GeoFenceSchemaTypes extends GeoFenceTypes {
    ownerId: ObjectId;
    trucks: ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

type OptionalGeoFenceTypes = Partial<GeoFenceTypes>;

export { GeoFenceSchemaTypes, GeoFenceTypes, OptionalGeoFenceTypes };
