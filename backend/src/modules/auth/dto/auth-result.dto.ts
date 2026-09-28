import { SystemUserDto } from 'src/modules/system-user/dto/system-user.dto';

export class AuthResultDto {
  token: string;
  refreshToken: string;
  Expiration: Date;
  User: SystemUserDto;
}
