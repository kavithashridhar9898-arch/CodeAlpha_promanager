import { Router } from 'express';
import { taskController } from '../controllers/taskController';
import { authenticate } from '../middleware/authMiddleware';
import { activityController } from '../controllers/activityController';
import { validate } from '../middleware/validateMiddleware';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  assignTaskSchema,
  updateTaskStatusSchema,
  updateTaskPrioritySchema,
  updateTaskDueDateSchema,
} from '../validators/taskValidators';
import { checklistRouter } from './checklistRoutes';
import { attachmentRouter } from './attachmentRoutes';

const taskRoutes = Router();

taskRoutes.use(authenticate);

taskRoutes
  .route('/')
  .post(validate(createTaskSchema), taskController.create);

taskRoutes.get('/filter', taskController.getFilteredTasks);
taskRoutes.get('/calendar', taskController.getCalendarTasks);

taskRoutes
  .route('/:id')
  .get(taskController.getById)
  .put(validate(updateTaskSchema), taskController.update)
  .delete(taskController.delete);

taskRoutes.patch('/:id/move', validate(moveTaskSchema), taskController.move);
taskRoutes.patch('/:id/assign', validate(assignTaskSchema), taskController.assign);
taskRoutes.patch('/:id/status', validate(updateTaskStatusSchema), taskController.updateStatus);
taskRoutes.patch('/:id/priority', validate(updateTaskPrioritySchema), taskController.updatePriority);
taskRoutes.patch('/:id/due-date', validate(updateTaskDueDateSchema), taskController.updateDueDate);

taskRoutes.get('/:taskId/activity', activityController.getTaskActivity);
taskRoutes.use('/:taskId/checklists', checklistRouter);
taskRoutes.use('/:taskId/attachments', attachmentRouter);

export { taskRoutes };
