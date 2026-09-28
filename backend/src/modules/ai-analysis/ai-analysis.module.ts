import { Module } from '@nestjs/common';
import { PrismaAiAnalysisRepository } from './repositories/prisma-ai-analysis.repository';
import { OpenAIProviderService } from './providers/openai-provider.service';
import { DefaultAiAnalysisOrchestratorService } from './services/default-ai-analysis-orchestrator.service';
import { AiAnalysisController } from './controllers/ai-analysis.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiAnalysisController],
  providers: [
    {
      provide: 'AiAnalysisRepository',
      useClass: PrismaAiAnalysisRepository,
    },
    {
      provide: 'AiProviderService',
      useClass: OpenAIProviderService,
    },
    {
      provide: 'AiAnalysisOrchestratorService',
      useClass: DefaultAiAnalysisOrchestratorService,
    },
  ],
  exports: ['AiAnalysisOrchestratorService'],
})
export class AiAnalysisModule {}
