import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('SECRET_PASSPORT'),
    });
  }

  async validate(payload: any) {
    return payload;
  }
}

export const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['access_token'];
  }
  return null;
};
