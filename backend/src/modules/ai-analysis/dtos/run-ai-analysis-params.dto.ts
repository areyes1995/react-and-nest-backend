import { AiAnalysisType } from "@prisma/client";
import { AiPromptDto } from "./ai-prompt.dto";
import { ZodType } from "zod";

export interface RunAiAnalysisParams<T> {
  projectId?: number | bigint;
  analysisType: AiAnalysisType;
  analyzedById?: number;
  prompt: AiPromptDto;
  schema: ZodType<T>;
  inputHash: string;
  promptVersion?: string;
}