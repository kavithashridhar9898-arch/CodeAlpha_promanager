export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIStreamResponse {
  pipeDataStreamToResponse: (res: any) => void;
}

export interface AIProvider {
  /**
   * Generates a streaming chat response
   */
  streamChat(messages: AIChatMessage[], options?: any): Promise<AIStreamResponse>;
  
  /**
   * Generates a non-streaming text response
   */
  generateText(messages: AIChatMessage[], options?: any): Promise<string>;
}
