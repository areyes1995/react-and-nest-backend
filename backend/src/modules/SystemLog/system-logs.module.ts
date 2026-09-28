import { Module } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { SystemLogsController } from './controllers/system-logs.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SystemLogsController],
  providers: [SystemLogsService],
})
export class SystemLogsModule {}
