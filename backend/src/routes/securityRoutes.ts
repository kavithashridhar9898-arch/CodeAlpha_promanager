import { Router } from 'express';
import { z } from 'zod';
import { securityController } from '../controllers/securityController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateMiddleware';

const securityRouter = Router();

securityRouter.use(authenticate);

const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

securityRouter.put('/password', validate(updatePasswordSchema), securityController.updatePassword);
securityRouter.get('/sessions', securityController.getSessions);
securityRouter.delete('/sessions/:id', securityController.revokeSession);
securityRouter.delete('/account', securityController.deleteAccount);

export { securityRouter };
