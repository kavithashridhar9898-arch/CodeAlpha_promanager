import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateMiddleware';
import {
  createProjectSchema,
  updateProjectSchema,
  archiveProjectSchema,
  inviteMemberSchema,
} from '../validators/projectValidators';

const projectRouter = Router();

// All project routes are protected
projectRouter.use(authenticate);

projectRouter
  .route('/')
  .get(projectController.getAll)
  .post(validate(createProjectSchema), projectController.create);

projectRouter
  .route('/:id')
  .get(projectController.getById)
  .put(validate(updateProjectSchema), projectController.update)
  .delete(projectController.delete);

projectRouter.patch('/:id/archive', validate(archiveProjectSchema), projectController.archive);

projectRouter.post('/:id/invite', validate(inviteMemberSchema), projectController.addMember);
projectRouter.delete('/:id/member/:memberId', projectController.removeMember);

export { projectRouter };
