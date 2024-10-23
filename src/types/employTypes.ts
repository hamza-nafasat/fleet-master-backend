import { Types } from "mongoose";

interface EmployTypes {
  ownerId: Types.ObjectId | null;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNumber: string;
  password: string;
}

interface EmploySchemaTypes extends EmployTypes {
  image: { url: string; public_id: string };
  createdAt: Date;
  updatedAt: Date;
  isVerified: true;
}

type OptionalEmployTypes = Partial<EmployTypes>;

export { EmployTypes, EmploySchemaTypes, OptionalEmployTypes };
