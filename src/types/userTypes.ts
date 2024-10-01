import { Types } from "mongoose";

interface UserTypes {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  address: string;
  password: string;
  customDb?: boolean;
  customDbHost?: string;
  customDbName?: string;
  customDbUsername?: string;
  customDbPassword?: string;
  customDbPort?: number;
}
interface UserSchemaTypes extends UserTypes {
  _id: string;
  role: string;
  interval: number;
  isVerified: boolean;
  subscriptionId: Types.ObjectId;
  image: { url: string; public_id: string };
  createdAt: Date;
  updatedAt: Date;
}

export { UserTypes, UserSchemaTypes };
