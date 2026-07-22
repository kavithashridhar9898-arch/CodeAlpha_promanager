import { Router } from 'express';
import { authRouter } from './authRoutes';
import { projectRouter } from './projectRoutes';
import { boardRoutes } from './boardRoutes';
import { taskRoutes } from './taskRoutes';
import { commentRouter } from './commentRoutes';
import { notificationRouter } from './notificationRoutes';
import { activityRouter } from './activityRoutes';
import { searchRoutes } from './searchRoutes';
import { analyticsRoutes } from './analyticsRoutes';
import { profileRouter } from './profileRoutes';
import { securityRouter } from './securityRoutes';
import { teamRouter } from './teamRoutes';
import { invitationRouter } from './invitationRoutes';
import { labelRouter } from './labelRoutes';
import { activityController } from '../controllers/activityController';
import { authenticate } from '../middleware/authMiddleware';

const apiRouter = Router();

// ─── API version info ─────────────────────────────────────────────────────────
apiRouter.get('/', (_req, res) => {
  res.json({
    message: 'ProManager API v1',
    version: '1.0.0',
    endpoints: ['/auth', '/projects', '/tasks', '/comments', '/notifications'],
  });
});

// ─── Feature Routers ──────────────────────────────────────────────────────────
apiRouter.use('/auth', authRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/projects', boardRoutes); // /projects/:projectId/board
apiRouter.use('/tasks', taskRoutes);     // /tasks/:id, /tasks, /tasks/:id/move etc.
apiRouter.use('/', commentRouter);       // /tasks/:taskId/comments and /comments/:id
apiRouter.use('/projects/:projectId/activity', activityRouter);
apiRouter.get('/activity', authenticate, activityController.getGlobalActivity);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/', analyticsRoutes); // handles /dashboard and /analytics
apiRouter.use('/profile', profileRouter);
apiRouter.use('/security', securityRouter);
apiRouter.use('/teams', teamRouter);
apiRouter.use('/invitations', invitationRouter);
apiRouter.use('/labels', labelRouter);
import aiRoutes from './aiRoutes';
import chatRoutes from './chatRoutes';
import meetingRoutes from './meetingRoutes';
import integrationRoutes from './integrationRoutes';

apiRouter.use('/ai', aiRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/meetings', meetingRoutes);
apiRouter.use('/integrations', integrationRoutes);

import automationRoutes from './automationRoutes';
import timeRoutes from './timeRoutes';

apiRouter.use('/automations', automationRoutes);
apiRouter.use('/time', timeRoutes);

export { apiRouter };
