import express from 'express';
import { chatStream, getConversations, getConversationHistory } from '../controllers/aiController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

// Streaming Chat API
router.post('/chat', chatStream);

// Conversation Memory APIs
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationHistory);

export default router;
