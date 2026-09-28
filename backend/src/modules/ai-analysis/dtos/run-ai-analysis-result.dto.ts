import { AiAnalysisDto } from "./ai-analysis.dto";

export interface RunAiAnalysisResult<T> {
  analysis: AiAnalysisDto;
  response: T;
  cached: boolean;
}