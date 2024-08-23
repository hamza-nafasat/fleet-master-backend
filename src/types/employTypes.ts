interface EmployTypes {
    ownerId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    phoneNumber: string;
}

interface EmploySchemaTypes extends EmployTypes {
    image: { url: string; public_id: string };
    createdAt: Date;
    updatedAt: Date;
}

type OptionalEmployTypes = Partial<EmployTypes>;

export { EmployTypes, EmploySchemaTypes, OptionalEmployTypes };
