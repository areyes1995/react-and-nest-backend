import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { ReportModule } from '../report/report.module';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

@Module({
  imports: [CalendarModule, ReportModule],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
