export class AiProviderConfigException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiProviderConfigException';
  }
}
