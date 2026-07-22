import { ProviderFactory } from './providers/providerFactory';
import { PromptManager } from './prompts/promptManager';
import { ContextBuilder } from './contextBuilder';
import { ConversationService } from './conversationService';
import { AIChatMessage } from './providers/providerInterface';

export class AIService {
  /**
   * Handle an incoming chat message and stream the response
   */
  static async handleChatStream(
    userId: string,
    message: string,
    projectId?: string,
    promptType: string = 'chat'
  ) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("AI is not configured. Please configure AI_PROVIDER and API keys in the environment.");
    }

    const provider = ProviderFactory.getProvider();
    
    // 1. Get or create conversation memory
    const conversation = await ConversationService.getOrCreateConversation(userId, projectId);
    
    // 2. Fetch history (limited to last 10 messages to save context window)
    const history = await ConversationService.getConversation(conversation.id, userId);
    const recentHistory = history.messages.slice(-10).map((m: any) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));

    // 3. Build dynamic context based on scope
    let contextData;
    if (projectId) {
      contextData = await ContextBuilder.buildProjectContext(projectId, userId);
    } else {
      contextData = await ContextBuilder.buildDashboardContext(userId);
    }

    // 4. Generate system prompt using the prompt manager
    const systemPromptText = PromptManager.get(promptType, contextData);
    
    // 5. Construct message array
    const messages: AIChatMessage[] = [
      { role: 'system', content: systemPromptText },
      ...recentHistory,
      { role: 'user', content: message }
    ];

    // 6. Save user message to memory
    await ConversationService.saveMessage(conversation.id, 'user', message);

    // 7. Request stream from provider
    const stream = await provider.streamChat(messages, {
      onFinish: async (completion: any) => {
        // 8. Save assistant response to memory when stream finishes
        await ConversationService.saveMessage(conversation.id, 'assistant', completion.text);
        
        // If it's the first message, maybe update the title?
        // Omitting for brevity
      }
    });

    return stream;
  }
}
