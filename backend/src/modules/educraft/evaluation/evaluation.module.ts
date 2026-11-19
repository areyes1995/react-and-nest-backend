import { Module } from '@nestjs/common';
import {
  AssessmentInstrumentsController,
  ExamsController,
  InstrumentsController,
  QuestionsController,
} from './evaluation.controller';
import { EvaluationService } from './evaluation.service';

@Module({
  controllers: [
    QuestionsController,
    ExamsController,
    InstrumentsController,
    AssessmentInstrumentsController,
  ],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
