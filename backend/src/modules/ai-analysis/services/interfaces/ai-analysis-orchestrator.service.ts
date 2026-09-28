import { AiAnalysisQueryParametersDto } from 'modules/ai-analysis/dtos/ai-analysis-query-parameters.dto';
import { AiAnalysisDto } from 'modules/ai-analysis/dtos/ai-analysis.dto';
import { PagedResultDto } from 'src/shared/dtos/paged-result.dto';
import { RunAiAnalysisParams } from 'modules/ai-analysis/dtos/run-ai-analysis-params.dto';
import { RunAiAnalysisResult } from 'modules/ai-analysis/dtos/run-ai-analysis-result.dto';

export interface AiAnalysisOrchestratorService {
  getAiAnalysisById(id: number): Promise<AiAnalysisDto>;
  getAiAnalysis(
    query: AiAnalysisQueryParametersDto,
  ): Promise<PagedResultDto<AiAnalysisDto>>;
  run<T>(params: RunAiAnalysisParams<T>): Promise<RunAiAnalysisResult<T>>;
}
