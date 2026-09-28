import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'modules/auth/auth.module';
import { SystemUserModule } from 'src/modules/system-user/system-user.module';
import { CreateAdminCommand } from './commands/user/create-admin.command';
import { CliValidationService } from './services/cli-validation.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    SystemUserModule,
  ],
  providers: [
    CreateAdminCommand,
    {
      provide: 'CliValidationService',
      useClass: CliValidationService,
    },
  ],
})
export class CliModule {}