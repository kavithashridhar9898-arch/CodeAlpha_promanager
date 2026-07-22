import { Request, Response } from 'express';
import { AIService } from '../services/ai/aiService';
import { ConversationService } from '../services/ai/conversationService';

export const chatStream = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, projectId, promptType } = req.body;
    const userId = req.user!.id; // Assumes authMiddleware protects this route

    if (!messages || messages.length === 0) {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const messageContent = lastMessage.content;

    const streamResponse = await AIService.handleChatStream(userId, messageContent, projectId, promptType);
    
    // Using Vercel AI SDK to stream directly into the Express Response
    (streamResponse as any).pipeTextStreamToResponse(res);
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    if (error.message.includes('AI is not configured')) {
      res.status(503).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to generate AI response: ' + error.message });
  }
};

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    const userId = req.user!.id;

    const conversations = await ConversationService.getConversationsList(userId, projectId as string);
    res.json({ success: true, data: conversations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversationHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const conversation = await ConversationService.getConversation(id as string, userId);
    res.json({ success: true, data: conversation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
