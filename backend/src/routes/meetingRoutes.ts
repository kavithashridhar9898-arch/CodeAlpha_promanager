import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { createMeeting, getMeetings, joinMeeting, cancelMeeting } from '../controllers/meetingController';

const router = Router();
router.use(authenticate);

router.get('/', getMeetings);
router.post('/', createMeeting);
router.patch('/:meetingId/join', joinMeeting);
router.delete('/:meetingId', cancelMeeting);

export default router;
