import { Module } from '@nestjs/common';
import { AuthLogService } from './auth-log.service';
import { AuthLogController } from './auth-log.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthLogController],
  providers: [AuthLogService],
  exports: [AuthLogService],
})
export class AuthLogModule {}