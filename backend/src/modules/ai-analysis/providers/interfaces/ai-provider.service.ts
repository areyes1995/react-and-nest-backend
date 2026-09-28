import { AiPromptDto } from 'modules/ai-analysis/dtos/ai-prompt.dto';
import { AiResponseEnvelope } from 'modules/ai-analysis/dtos/ai-response-envelope.dto';
import { ZodType } from 'zod';

export interface AiProviderService {
  analyze<T>(
    prompt: AiPromptDto,
    schema: ZodType<T>,
  ): Promise<AiResponseEnvelope<T>>;
}
