import { Types } from "mongoose";

interface DriverTypes {
    firstName: string;
    lastName: string;
    licenseExpiry: Date;
    fleetNumber: number;
    phoneNumber: string;
    assignedTruck?: Types.ObjectId | null;
    removeAssignedTruck?: Types.ObjectId | null;
}
interface SchemaDriverTypes extends DriverTypes {
    image: { url: string; public_id: string };
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}

type OptionalDriverTypes = Partial<DriverTypes>;

export { DriverTypes, SchemaDriverTypes, OptionalDriverTypes };
