import { IsInt, IsString, IsOptional } from 'class-validator';

export class CreateAuthLogDto {

  @IsInt()
  userId!: number;

  @IsString()
  action!: string; 
  // LOGIN | LOGOUT | LOGIN_FAILED

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

}