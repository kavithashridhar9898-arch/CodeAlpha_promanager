import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/authMiddleware';

const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', notificationController.getForUser);
notificationRouter.patch('/read-all', notificationController.markAllAsRead);
notificationRouter.patch('/:id/read', notificationController.markAsRead);
notificationRouter.delete('/:id', notificationController.delete);

export { notificationRouter };
