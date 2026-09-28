import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, Matches } from 'class-validator';

export class UpdateSystemUserDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @ApiProperty()
  firstName!: string;

  @IsString()
  @MinLength(3, { message: 'El apellido debe tener al menos 3 caracteres' })
  @ApiProperty()
  lastName!: string;

  @IsOptional()
  @IsString()
  @Matches(
    /^(?:\+?1[-\s]?|1[-\s]?|)?\(?([2-9][0-9]{2})\)?[-\s]?([2-9][0-9]{2})[-\s]?([0-9]{4})$/,
    {
      message: 'Debe ser un número de teléfono válido',
    },
  )
  @ApiProperty({ required: false })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Nombre del rol existente en la tabla Role (RBAC)',
  })
  role?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  emailVerified?: boolean;

  @IsOptional()
  mustChangePassword?: boolean;
}
