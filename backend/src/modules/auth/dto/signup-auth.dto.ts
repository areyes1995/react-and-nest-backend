import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthResultDto } from './auth-result.dto';

/** Registro público de un docente. */
export class SignupAuthDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100)
  @ApiProperty()
  firstName!: string;

  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(100)
  @ApiProperty()
  lastName!: string;

  @IsEmail({}, { message: 'Debe ser un email válido' })
  @ApiProperty()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @ApiProperty()
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @ApiProperty({ required: false })
  institution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @ApiProperty({ required: false, default: 'Matemática' })
  specialty?: string;
}

export class SignupResultDto {
  @ApiProperty()
  requiresVerification!: boolean;

  @ApiProperty({ required: false, type: AuthResultDto })
  session?: AuthResultDto;
}
