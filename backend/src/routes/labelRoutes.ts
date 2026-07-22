import { Router } from 'express';
import { labelController } from '../controllers/labelController';
import { authenticate } from '../middleware/authMiddleware';

const labelRouter = Router();
labelRouter.use(authenticate);

labelRouter.get('/', labelController.getAll);
labelRouter.post('/', labelController.create);
labelRouter.patch('/:id', labelController.update);
labelRouter.delete('/:id', labelController.delete);

export { labelRouter };
