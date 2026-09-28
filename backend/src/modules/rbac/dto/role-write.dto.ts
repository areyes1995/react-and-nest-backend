import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'El nombre del rol debe estar en MAYÚSCULAS con guiones bajos (ej. EXHIBITOR)',
  })
  @ApiProperty({ example: 'EXHIBITOR' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ required: false })
  description?: string;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ required: false })
  description?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  isActive?: boolean;
}

export class SetRolePermissionsDto {
  @Type(() => Number)
  @IsInt({ each: true })
  @ApiProperty({ type: [Number], description: 'IDs de permisos asignados (reemplaza los actuales)' })
  permissionIds!: number[];
}
