export interface AiResponseEnvelope<T> {
  data: T;

  metadata: {
    provider: string;

    model: string;

    modelVersion?: string;

    requestId?: string;

    processingTimeMs?: number;

    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
  };

  raw?: unknown;
}