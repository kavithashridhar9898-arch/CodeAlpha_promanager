import { AIProvider } from './providerInterface';
import { OpenAIProvider } from './openAIProvider';

export class ProviderFactory {
  static getProvider(): AIProvider {
    const providerName = process.env.AI_PROVIDER?.toLowerCase() || 'openai';

    switch (providerName) {
      case 'openai':
        return new OpenAIProvider();
      // Future providers can be added here easily:
      // case 'anthropic': return new AnthropicProvider();
      // case 'gemini': return new GeminiProvider();
      default:
        throw new Error(`Unsupported AI_PROVIDER: ${providerName}`);
    }
  }
}
