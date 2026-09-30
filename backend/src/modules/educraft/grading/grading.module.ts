import { Module } from '@nestjs/common';
import { AssessmentsController, GradesController } from './grading.controller';
import { GradingService } from './grading.service';

@Module({
  controllers: [GradesController, AssessmentsController],
  providers: [GradingService],
  exports: [GradingService],
})
export class GradingModule {}
