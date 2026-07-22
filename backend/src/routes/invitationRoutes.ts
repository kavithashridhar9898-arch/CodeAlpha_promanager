import { Router } from 'express';
import { invitationController } from '../controllers/invitationController';
import { authenticate } from '../middleware/authMiddleware';

const invitationRouter = Router();

invitationRouter.use(authenticate);

invitationRouter.get('/', invitationController.getMyInvitations);
invitationRouter.post('/:token/accept', invitationController.acceptInvitation);
invitationRouter.post('/:token/decline', invitationController.declineInvitation);

export { invitationRouter };
