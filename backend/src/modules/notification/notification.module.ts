import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { MailerModule } from 'src/modules/mailer/mailer.module';
import { ReportModule } from 'src/modules/educraft/report/report.module';

@Module({
  imports: [PrismaModule, MailerModule, ReportModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
