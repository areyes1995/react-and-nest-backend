import { Module } from '@nestjs/common';
import { CurriculumModule } from '../curriculum/curriculum.module';
import {
  ActivitiesController,
  LessonPlansController,
  PresentationsController,
  UnitsController,
} from './planning.controller';
import { PlanningService } from './planning.service';

@Module({
  imports: [CurriculumModule],
  controllers: [UnitsController, LessonPlansController, PresentationsController, ActivitiesController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
