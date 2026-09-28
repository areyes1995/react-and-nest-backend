export class AuthUserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  roles: string[];
  permissions: string[];
  emailVerified: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
