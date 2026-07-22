import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat/chatService';
import { AppError } from '../utils/AppError';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { ConversationType } from '@prisma/client';

// ─── File Upload Configuration ────────────────────────────────────────────────
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

export const chatUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversations = await ChatService.getConversations(userId);
    res.json({ success: true, data: conversations });
  } catch (err) { next(err); }
};

export const createConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { type, name, description, memberUserIds, teamId, projectId, targetUserId } = req.body;

    let conversation;
    if (type === 'DIRECT') {
      if (!targetUserId) throw new AppError('targetUserId required for DIRECT conversation', 400);
      conversation = await ChatService.findOrCreateDM(userId, targetUserId as string);
    } else {
      conversation = await ChatService.createConversation(userId, {
        type: type as ConversationType,
        name,
        description,
        memberUserIds: memberUserIds || [],
        teamId,
        projectId,
      });
    }

    res.status(201).json({ success: true, data: conversation });
  } catch (err) { next(err); }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId as string;
    const cursor = req.query.cursor as string | undefined;
    const limitStr = req.query.limit as string | undefined;

    const messages = await ChatService.getMessages(
      conversationId,
      userId,
      cursor,
      limitStr ? parseInt(limitStr) : 40,
    );

    res.json({ success: true, data: messages });
  } catch (err) { next(err); }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId as string;
    const { content, replyToId, mentionedUsers, type } = req.body;

    const attachments = (req.files as Express.Multer.File[] | undefined)?.map((f) => ({
      filename: f.filename,
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
      url: `/uploads/chat/${f.filename}`,
    }));

    const messageType = attachments?.length
      ? attachments[0].mimeType.startsWith('image/') ? 'IMAGE'
        : attachments[0].mimeType.startsWith('audio/') ? 'VOICE'
        : 'FILE'
      : type || 'TEXT';

    const message = await ChatService.sendMessage(conversationId, userId, {
      type: messageType,
      content,
      replyToId,
      mentionedUsers,
      attachments,
    });

    res.status(201).json({ success: true, data: message });
  } catch (err) { next(err); }
};

export const editMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const messageId = req.params.messageId as string;
    const { content } = req.body;

    if (!content?.trim()) throw new AppError('Content is required', 400);

    const message = await ChatService.editMessage(messageId, userId, content);
    res.json({ success: true, data: message });
  } catch (err) { next(err); }
};

export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const messageId = req.params.messageId as string;

    await ChatService.deleteMessage(messageId, userId);
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) { next(err); }
};

export const toggleReaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const messageId = req.params.messageId as string;
    const { emoji } = req.body;

    if (!emoji) throw new AppError('Emoji is required', 400);

    const result = await ChatService.toggleReaction(messageId, userId, emoji);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const pinMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId as string;
    const messageId = req.params.messageId as string;

    const pinned = await ChatService.pinMessage(conversationId, messageId, userId);
    res.status(201).json({ success: true, data: pinned });
  } catch (err) { next(err); }
};

export const unpinMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversationId = req.params.conversationId as string;
    const messageId = req.params.messageId as string;
    await ChatService.unpinMessage(conversationId, messageId);
    res.json({ success: true, message: 'Message unpinned' });
  } catch (err) { next(err); }
};

export const getPinnedMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversationId = req.params.conversationId as string;
    const pinned = await ChatService.getPinnedMessages(conversationId);
    res.json({ success: true, data: pinned });
  } catch (err) { next(err); }
};

export const searchMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const q = req.query.q as string | undefined;

    if (!q) throw new AppError('Search query required', 400);

    const results = await ChatService.searchMessages(userId, q);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};

export const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId as string;
    await ChatService.markRead(conversationId, userId);
    res.json({ success: true });
  } catch (err) { next(err); }
};
