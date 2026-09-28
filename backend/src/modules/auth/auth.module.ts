import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategies';
import { DefaultAuthService } from './services/default-auth.service';
import { AccountTokenService } from './services/account-token.service';
import { SystemUserModule } from '../system-user/system-user.module';
import { AuthLogModule } from '../auth-log/auth-log.module';
import { MailerModule } from '../mailer/mailer.module';
import { PrismaModule } from 'prisma/prisma.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule,
    SystemUserModule,
    AuthLogModule,
    MailerModule,
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('SECRET_PASSPORT'),
        signOptions: { expiresIn: '5h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    AccountTokenService,
    {
      provide: 'AuthService',
      useClass: DefaultAuthService,
    },
  ],
})
export class AuthModule {}
