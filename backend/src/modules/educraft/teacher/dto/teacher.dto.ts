import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

/** '' o null permiten borrar la imagen. */
const hasValue = (_: unknown, v: unknown) => v !== '' && v != null;

export class UpdateTeacherProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ required: false })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ required: false })
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  @ApiProperty({ required: false })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiProperty({ required: false, example: 'Prof.' })
  displayTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @ApiProperty({ required: false })
  specialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @ApiProperty({ required: false })
  institution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @ApiProperty({ required: false })
  district?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  bio?: string;

  @ValidateIf(hasValue)
  @Matches(/^(data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+|https?:\/\/\S+)$/, {
    message: 'La imagen debe ser una URL o un data URL PNG/JPEG/WEBP',
  })
  @MaxLength(700_000)
  @ApiProperty({ required: false, description: 'Foto de perfil (URL o data URL)' })
  avatarUrl?: string | null;

  @ValidateIf(hasValue)
  @Matches(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, { message: 'La firma debe ser un PNG (data URL)' })
  @MaxLength(500_000)
  @ApiProperty({ required: false, description: 'Firma digital (data URL PNG)' })
  signature?: string | null;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  googleCalendarSync?: boolean;

  @IsOptional()
  @IsObject()
  @ApiProperty({ required: false })
  preferences?: Record<string, unknown>;
}
