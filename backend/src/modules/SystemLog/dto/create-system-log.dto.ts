import { IsInt, IsString, IsOptional } from 'class-validator';

export class CreateSystemLogDto {
  @IsInt()
  @IsOptional()
  userId?: number;
  actionType!: string;
  entityName!: string;
  entityId?: number;
  oldValue?: string;
  value?: string;
  ipAddress?: string;
}
