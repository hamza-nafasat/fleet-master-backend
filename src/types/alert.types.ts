import { Types } from "mongoose";

interface AlertTypes {
  type: string;
  severity: string;
  status: string;
  platform: string;
}
interface AlertSchemaTypes extends AlertTypes {
  ownerId: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

type optionalAlertTypes = Partial<AlertTypes>;

export { AlertTypes, AlertSchemaTypes, optionalAlertTypes };
