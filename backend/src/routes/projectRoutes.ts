import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { invitationController } from '../controllers/invitationController';
import { exportController } from '../controllers/exportController';
import { authenticate } from '../middleware/authMiddleware';
import { cache } from '../middleware/cacheMiddleware';
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
  .get(cache(60), projectController.getAll)
  .post(validate(createProjectSchema), projectController.create);

projectRouter
  .route('/:id')
  .get(projectController.getById)
  .put(validate(updateProjectSchema), projectController.update)
  .delete(projectController.delete);

projectRouter.patch('/:id/archive', validate(archiveProjectSchema), projectController.archive);

projectRouter.post('/:id/invite', validate(inviteMemberSchema), projectController.addMember);
projectRouter.delete('/:id/member/:memberId', projectController.removeMember);

// Invitation routes
projectRouter.post('/:id/invitations', invitationController.inviteToProject);
projectRouter.get('/:id/invitations', invitationController.getProjectInvitations);

// Export routes
projectRouter.get('/:id/export/csv', exportController.exportTasksCSV);
projectRouter.get('/:id/export/json', exportController.exportProjectJSON);

export { projectRouter };
