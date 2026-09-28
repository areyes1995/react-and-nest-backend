import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginAuthDto {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsString()
  @MinLength(8)
  @ApiProperty()
  password: string;
}
