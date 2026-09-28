import { ZodType } from 'zod';
import { AiProviderService } from './interfaces/ai-provider.service';
import { AiPromptDto } from '../dtos/ai-prompt.dto';
import { AiProviderConfigException } from '../exceptions/ai-provider-config.exception';
import { AiProviderParseException } from '../exceptions/ai-provider-parse.exception';
import { Injectable } from '@nestjs/common';
import { AiProviderException } from '../exceptions/ai-provider.exception';
import { AiResponseEnvelope } from '../dtos/ai-response-envelope.dto';

@Injectable()
export class OpenAIProviderService implements AiProviderService {
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly apiUrl = process.env.OPENAI_API_URL;

  async analyze<T>(
    prompt: AiPromptDto,
    schema: ZodType<T>,
  ): Promise<AiResponseEnvelope<T>> {
    if (!this.apiUrl) {
      throw new AiProviderConfigException('OPENAI_API_URL is not set.');
    }

    if (!this.apiKey) {
      throw new AiProviderConfigException('OPENAI_API_KEY is not set.');
    }

    prompt.model = prompt.model || 'gpt-5-mini';

    const payload = {
      model: prompt.model,
      messages: [
        {
          role: 'system',
          content: prompt.systemInstructions,
        },
        {
          role: 'user',
          content: prompt.userPrompt,
        },
      ],
      temperature: prompt.temperature ?? 1,
    };

    let result;

    const startedAt = Date.now();

    try {
      result = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      throw new AiProviderException({
        message: 'Failed to call OpenAI API',
        cause: err,
      });
    }

    const processingTimeMs = Date.now() - startedAt;

    if (!result.ok) {
      const errorText = await result.text();

      throw new AiProviderException({
        message: `OpenAI API error ${result.status}`,
        statusCode: result.status,
        raw: errorText,
      });
    }

    const data = await result.json();

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new AiProviderException({
        message: 'Empty response from OpenAI API',
      });
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch (err) {
      throw new AiProviderParseException(
        'Invalid JSON returned by AI',
        content,
      );
    }

    return {
      data: schema.parse(parsed),

      metadata: {
        provider: 'OpenAI',

        model: data.model,

        modelVersion: data.model,

        requestId: data.id,

        processingTimeMs,

        tokens: {
          prompt: data.usage?.prompt_tokens ?? 0,
          completion: data.usage?.completion_tokens ?? 0,
          total: data.usage?.total_tokens ?? 0,
        },
      },

      raw: data,
    };
  }
}
