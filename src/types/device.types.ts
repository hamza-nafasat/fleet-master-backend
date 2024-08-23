import { Types } from "mongoose";

interface DeviceTypes {
  ownerId: Types.ObjectId;
  name: string;
  type: string;
  ip: string;
  url: string | null;
  uniqueId: string;
  assignedTo?: Types.ObjectId | null;
}
interface DeviceSchemaTypes extends DeviceTypes {
  createdAt: Date;
  updatedAt: Date;
}

type optionalDeviceTypes = Partial<DeviceTypes>;

export { DeviceTypes, DeviceSchemaTypes, optionalDeviceTypes };
