import { Types } from "mongoose";

interface TruckTypes {
  truckName: string;
  fleetNumber: number;
  plateNumber: string;
  devices: [Types.ObjectId] | undefined;
  assignedTo: Types.ObjectId | undefined;
}

interface SchemaTruckTypes extends TruckTypes {
  image: { url: string; public_id: string };
  assignedTruck: Types.ObjectId | null;
  ownerId: string;
  status: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

type OptionalTruckTypes = Partial<TruckTypes>;

export { TruckTypes, SchemaTruckTypes, OptionalTruckTypes };
