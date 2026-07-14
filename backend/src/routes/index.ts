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
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/', analyticsRoutes); // handles /dashboard and /analytics

export { apiRouter };
