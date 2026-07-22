import { Router } from 'express';
import { 
  startTimer, 
  stopTimer, 
  getActiveTimer, 
  logTime, 
  getProjectTimeReport, 
  getUserTimesheet 
} from '../controllers/timeController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/timer/start', startTimer);
router.post('/timer/stop', stopTimer);
router.get('/timer/active', getActiveTimer);

router.post('/log', logTime);
router.get('/timesheet', getUserTimesheet);
router.get('/report/project/:projectId', getProjectTimeReport);

export default router;
