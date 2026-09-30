import { Module } from '@nestjs/common';
import { SchoolYearController } from './school-year.controller';
import { SchoolYearService } from './school-year.service';

@Module({
  controllers: [SchoolYearController],
  providers: [SchoolYearService],
  exports: [SchoolYearService],
})
export class SchoolYearModule {}
