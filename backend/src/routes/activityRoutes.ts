import { Router } from 'express';
import { activityController } from '../controllers/activityController';
import { authenticate } from '../middleware/authMiddleware';

const activityRouter = Router({ mergeParams: true });

activityRouter.use(authenticate);

// We will mount this router at /api/projects/:projectId/activity
activityRouter.get('/', activityController.getProjectActivity);

export { activityRouter };
