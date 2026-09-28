import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  MinLength,
} from 'class-validator';

export class RegisterAuthDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @ApiProperty()
  firstName!: string;

  @IsString()
  @MinLength(3, { message: 'El apellido debe tener al menos 3 caracteres' })
  @ApiProperty()
  lastName!: string;

  @IsString()
  @ApiProperty()
  employeeId!: string;

  @IsEmail({}, { message: 'Debe ser un email válido' })
  @ApiProperty()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @ApiProperty()
  password!: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber(undefined, {
    message: 'Debe ser un número de teléfono válido',
  })
  @ApiProperty()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Nombre del rol existente en la tabla Role (RBAC). Por defecto: GUEST',
    required: false,
  })
  role?: string;
}
