export interface AiPromptDto {
  systemInstructions: string;
  userPrompt: string;

  model?: string | null;

  temperature?: number | null;
}
