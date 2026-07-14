import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/authMiddleware';

const analyticsRoutes = Router();

analyticsRoutes.use(authenticate);

analyticsRoutes.get('/dashboard', analyticsController.getDashboardOverview);
analyticsRoutes.get('/charts', analyticsController.getAnalytics);

export { analyticsRoutes };
