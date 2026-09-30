import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { PublicReportController, ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [AttendanceModule],
  controllers: [ReportController, PublicReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
