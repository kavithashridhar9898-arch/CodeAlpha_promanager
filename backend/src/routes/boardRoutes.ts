import { Router } from 'express';
import { boardController } from '../controllers/boardController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateMiddleware';
import { getBoardSchema } from '../validators/boardValidators';

const boardRoutes = Router();

boardRoutes.use(authenticate);

boardRoutes.get('/:projectId/board', validate(getBoardSchema), boardController.getByProject);

export { boardRoutes };
