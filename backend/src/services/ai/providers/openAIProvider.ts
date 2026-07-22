import { openai } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { AIProvider, AIChatMessage, AIStreamResponse } from './providerInterface';

export class OpenAIProvider implements AIProvider {
  private modelName: string;
  private temperature: number;
  private maxTokens: number;

  constructor() {
    this.modelName = process.env.AI_MODEL || 'gpt-4o-mini';
    this.temperature = parseFloat(process.env.AI_TEMPERATURE || '0.3');
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS || '4000', 10);
  }

  async streamChat(messages: AIChatMessage[], options?: any): Promise<AIStreamResponse> {
    const result = streamText({
      model: openai(this.modelName),
      messages: messages as any[],
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      ...options,
    });

    return result as unknown as AIStreamResponse;
  }

  async generateText(messages: AIChatMessage[], options?: any): Promise<string> {
    const result = await generateText({
      model: openai(this.modelName),
      messages: messages as any[],
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      ...options,
    });

    return result.text;
  }
}
