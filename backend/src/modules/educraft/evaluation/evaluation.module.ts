import { Module } from '@nestjs/common';
import { ExamsController, InstrumentsController, QuestionsController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';

@Module({
  controllers: [QuestionsController, ExamsController, InstrumentsController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
