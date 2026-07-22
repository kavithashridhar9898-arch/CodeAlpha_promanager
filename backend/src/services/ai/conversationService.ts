import prisma from '../../config/database';

export class ConversationService {
  /**
   * Get or create a conversation for a project/user
   */
  static async getOrCreateConversation(userId: string, projectId?: string, title: string = "New Conversation") {
    // We try to find the most recent conversation for this scope
    let conv = await prisma.aIConversation.findFirst({
      where: {
        userId,
        projectId: projectId || null,
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (!conv) {
      conv = await prisma.aIConversation.create({
        data: {
          userId,
          projectId: projectId || null,
          title,
        }
      });
    }

    return conv;
  }

  static async getConversation(conversationId: string, userId: string) {
    const conv = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conv) throw new Error("Conversation not found or unauthorized.");
    return conv;
  }

  static async getConversationsList(userId: string, projectId?: string) {
    return prisma.aIConversation.findMany({
      where: { userId, projectId: projectId || null },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true }
    });
  }

  static async saveMessage(conversationId: string, role: string, content: string) {
    return prisma.aIMessage.create({
      data: {
        conversationId,
        role,
        content
      }
    });
  }
}
