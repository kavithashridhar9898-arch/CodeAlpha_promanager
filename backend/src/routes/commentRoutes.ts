import { Router } from 'express';
import { commentController } from '../controllers/commentController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateMiddleware';
import { createCommentSchema, updateCommentSchema } from '../validators/commentValidators';

const commentRouter = Router();

commentRouter.use(authenticate);

// GET  /api/tasks/:taskId/comments  — list comments for a task
// POST /api/tasks/:taskId/comments  — create a comment on a task
commentRouter
  .route('/tasks/:taskId/comments')
  .get(commentController.getByTask)
  .post(validate(createCommentSchema), commentController.create);

// PUT    /api/comments/:id  — edit a comment
// DELETE /api/comments/:id  — delete a comment
commentRouter
  .route('/comments/:id')
  .put(validate(updateCommentSchema), commentController.update)
  .delete(commentController.delete);

export { commentRouter };
