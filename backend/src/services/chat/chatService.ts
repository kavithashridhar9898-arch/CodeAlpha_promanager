import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { ConversationType, MessageType } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Conversation helpers
// ─────────────────────────────────────────────────────────────────────────────

export class ChatService {
  // List all conversations the user is a member of
  static async getConversations(userId: string) {
    const members = await prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            members: {
              select: { userId: true, unreadCount: true },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                attachments: { select: { originalName: true } },
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    return members.map((m) => ({
      ...m.conversation,
      unreadCount: m.unreadCount,
      lastMessage: m.conversation.messages[0] || null,
    }));
  }

  static async findOrCreateDM(userId: string, targetUserId: string) {
    const isSelf = userId === targetUserId;

    // Look for an existing DM between these two users
    const existing = await prisma.chatConversation.findFirst({
      where: {
        type: 'DIRECT',
        members: {
          every: { userId: { in: [userId, targetUserId] } },
        },
      },
      include: { members: true },
    });

    const expectedLength = isSelf ? 1 : 2;
    if (existing && existing.members.length === expectedLength) return existing;

    // Create new DM
    const uniqueMembers = Array.from(new Set([userId, targetUserId]));
    return prisma.chatConversation.create({
      data: {
        type: 'DIRECT',
        createdById: userId,
        members: {
          create: uniqueMembers.map((uid) => ({ userId: uid })),
        },
      },
      include: { members: true },
    });
  }

  // Create a named group, team, project, or workspace conversation
  static async createConversation(
    userId: string,
    data: {
      type: ConversationType;
      name?: string;
      description?: string;
      memberUserIds: string[];
      teamId?: string;
      projectId?: string;
    },
  ) {
    const memberIds = Array.from(new Set([userId, ...data.memberUserIds]));

    return prisma.chatConversation.create({
      data: {
        type: data.type,
        name: data.name,
        description: data.description,
        teamId: data.teamId,
        projectId: data.projectId,
        createdById: userId,
        members: {
          create: memberIds.map((uid) => ({ userId: uid })),
        },
      },
      include: {
        members: {
          select: { userId: true },
        },
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Message helpers
  // ─────────────────────────────────────────────────────────────────────────

  static async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit = 40,
  ) {
    // Verify membership
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new AppError('Not a member of this conversation', 403);

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },
      include: {
        reactions: true,
        attachments: true,
        pinnedAs: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    // Mark as read
    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });

    return messages.reverse();
  }

  static async sendMessage(
    conversationId: string,
    senderId: string,
    data: {
      type?: MessageType;
      content?: string;
      replyToId?: string;
      mentionedUsers?: string[];
      attachments?: Array<{
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
      }>;
      metadata?: Record<string, unknown>;
    },
  ) {
    // Verify membership
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!member) throw new AppError('Not a member of this conversation', 403);

    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId,
        type: data.type || 'TEXT',
        content: data.content,
        replyToId: data.replyToId,
        mentionedUsers: data.mentionedUsers ? JSON.stringify(data.mentionedUsers) : undefined,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        attachments: data.attachments
          ? { create: data.attachments }
          : undefined,
      },
      include: {
        reactions: true,
        attachments: true,
      },
    });

    // Increment unread for all OTHER members
    await prisma.conversationMember.updateMany({
      where: {
        conversationId,
        userId: { not: senderId },
      },
      data: { unreadCount: { increment: 1 } },
    });

    // Update conversation updatedAt for ordering
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  static async editMessage(messageId: string, userId: string, content: string) {
    const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new AppError('Message not found', 404);
    if (message.senderId !== userId) throw new AppError('Cannot edit another user\'s message', 403);

    return prisma.chatMessage.update({
      where: { id: messageId },
      data: { content, isEdited: true },
      include: { reactions: true, attachments: true },
    });
  }

  static async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new AppError('Message not found', 404);
    if (message.senderId !== userId) throw new AppError('Cannot delete another user\'s message', 403);

    return prisma.chatMessage.update({
      where: { id: messageId },
      data: { isDeleted: true, content: 'This message was deleted' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Reactions
  // ─────────────────────────────────────────────────────────────────────────

  static async toggleReaction(messageId: string, userId: string, emoji: string) {
    const existing = await prisma.messageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });

    if (existing) {
      await prisma.messageReaction.delete({ where: { id: existing.id } });
      return { action: 'removed', emoji };
    }

    const reaction = await prisma.messageReaction.create({
      data: { messageId, userId, emoji },
    });
    return { action: 'added', reaction };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Pinning
  // ─────────────────────────────────────────────────────────────────────────

  static async pinMessage(conversationId: string, messageId: string, userId: string) {
    return prisma.pinnedMessage.create({
      data: { conversationId, messageId, pinnedById: userId },
      include: { message: { include: { attachments: true } } },
    });
  }

  static async unpinMessage(conversationId: string, messageId: string) {
    return prisma.pinnedMessage.deleteMany({
      where: { conversationId, messageId },
    });
  }

  static async getPinnedMessages(conversationId: string) {
    return prisma.pinnedMessage.findMany({
      where: { conversationId },
      include: { message: { include: { attachments: true, reactions: true } } },
      orderBy: { pinnedAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Search
  // ─────────────────────────────────────────────────────────────────────────

  static async searchMessages(userId: string, query: string) {
    const memberOf = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    const conversationIds = memberOf.map((m) => m.conversationId);

    return prisma.chatMessage.findMany({
      where: {
        conversationId: { in: conversationIds },
        content: { contains: query },
        isDeleted: false,
      },
      include: {
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mark read
  // ─────────────────────────────────────────────────────────────────────────

  static async markRead(conversationId: string, userId: string) {
    return prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });
  }
}
