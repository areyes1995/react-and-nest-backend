import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { ReportModule } from '../report/report.module';
import { GoogleCalendarService } from './google-calendar.service';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

@Module({
  imports: [CalendarModule, ReportModule],
  controllers: [TeacherController],
  providers: [TeacherService, GoogleCalendarService],
  exports: [TeacherService, GoogleCalendarService],
})
export class TeacherModule {}
