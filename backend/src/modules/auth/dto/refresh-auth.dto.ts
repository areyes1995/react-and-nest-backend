import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshAuthDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Refresh token emitido en el login.' })
  refreshToken: string;
}
