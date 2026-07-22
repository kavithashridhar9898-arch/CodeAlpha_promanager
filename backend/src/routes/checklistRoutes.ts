import { Router } from 'express';
import { z } from 'zod';
import { checklistController } from '../controllers/checklistController';
import { validate } from '../middleware/validateMiddleware';
import { authenticate } from '../middleware/authMiddleware';

const checklistRouter = Router({ mergeParams: true });

checklistRouter.use(authenticate);

const createChecklistSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
  }),
});

const addChecklistItemSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Content is required'),
  }),
});

const updateChecklistItemSchema = z.object({
  body: z.object({
    content: z.string().optional(),
    isCompleted: z.boolean().optional(),
  }),
});

checklistRouter.get('/', checklistController.getChecklists);
checklistRouter.post('/', validate(createChecklistSchema), checklistController.createChecklist);
checklistRouter.delete('/:id', checklistController.deleteChecklist);

checklistRouter.post('/:id/items', validate(addChecklistItemSchema), checklistController.addChecklistItem);
checklistRouter.patch('/:id/items/:itemId', validate(updateChecklistItemSchema), checklistController.updateChecklistItem);
checklistRouter.delete('/:id/items/:itemId', checklistController.deleteChecklistItem);

export { checklistRouter };
