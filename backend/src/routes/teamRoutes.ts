import { Router } from 'express';
import { z } from 'zod';
import { teamController } from '../controllers/teamController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateMiddleware';

const teamRouter = Router();

teamRouter.use(authenticate);

const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
  }),
});

const updateTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
});

teamRouter.post('/', validate(createTeamSchema), teamController.createTeam);
teamRouter.get('/', teamController.getUserTeams);
teamRouter.get('/:id', teamController.getTeamById);
teamRouter.patch('/:id', validate(updateTeamSchema), teamController.updateTeam);
teamRouter.delete('/:id', teamController.deleteTeam);
teamRouter.post('/:id/members', teamController.addMember);
teamRouter.patch('/:id/members/:memberId/role', teamController.updateMemberRole);
teamRouter.delete('/:id/members/:memberId', teamController.removeMember);

export { teamRouter };
