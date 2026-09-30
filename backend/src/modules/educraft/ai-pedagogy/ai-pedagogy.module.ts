import { Module } from '@nestjs/common';
import { OpenAIProviderService } from 'src/modules/ai-analysis/providers/openai-provider.service';
import { DocumentModule } from 'src/modules/document/document.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { PlanningModule } from '../planning/planning.module';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { ReportModule } from '../report/report.module';
import { SectionModule } from '../section/section.module';
import { AiPedagogyController } from './ai-pedagogy.controller';
import { PedagogicalAiService } from './pedagogical-ai.service';

@Module({
  imports: [CurriculumModule, PlanningModule, EvaluationModule, ReportModule, SectionModule, DocumentModule],
  controllers: [AiPedagogyController],
  providers: [PedagogicalAiService, { provide: 'AiProviderService', useClass: OpenAIProviderService }],
  exports: [PedagogicalAiService],
})
export class AiPedagogyModule {}
