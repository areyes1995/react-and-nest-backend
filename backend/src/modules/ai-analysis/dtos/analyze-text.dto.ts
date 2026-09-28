import { IsInt, IsString, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class AnalyzeTextDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  projectId?: number;
}