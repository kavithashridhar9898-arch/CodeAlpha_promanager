import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  searchMessages,
  markRead,
  chatUpload,
} from '../controllers/chatController';

const router = Router();
router.use(authenticate);

// Conversations
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);

// Messages
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', chatUpload.array('files', 10), sendMessage);
router.patch('/conversations/:conversationId/read', markRead);

// Pinned messages
router.get('/conversations/:conversationId/pinned', getPinnedMessages);
router.post('/conversations/:conversationId/pin/:messageId', pinMessage);
router.delete('/conversations/:conversationId/pin/:messageId', unpinMessage);

// Individual messages
router.patch('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);
router.post('/messages/:messageId/reactions', toggleReaction);

// Search
router.get('/search', searchMessages);

export default router;
