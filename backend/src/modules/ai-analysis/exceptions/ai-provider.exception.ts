export class AiProviderException extends Error {
  public readonly cause?: unknown;
  public readonly statusCode?: number;
  public readonly raw?: unknown;

  constructor(params: {
    message: string;
    cause?: unknown;
    statusCode?: number;
    raw?: unknown;
  }) {
    super(params.message);

    this.name = 'AiProviderException';

    this.cause = params.cause;
    this.statusCode = params.statusCode;
    this.raw = params.raw;

    Object.setPrototypeOf(this, AiProviderException.prototype);
  }
}
