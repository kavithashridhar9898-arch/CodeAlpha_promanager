import { Request, Response, NextFunction } from 'express';
import { commentService } from '../services/commentService';
import { successResponse } from '../utils/response';
import { param } from '../utils/param';
import { emitToProject } from '../socket';
import prisma from '../config/database';

/** Resolve projectId from a taskId */
async function getProjectIdFromTask(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { column: { select: { board: { select: { projectId: true } } } } },
  });
  return task?.column.board.projectId ?? null;
}

/** Resolve projectId from a commentId */
async function getProjectIdFromComment(commentId: string): Promise<{ projectId: string; taskId: string } | null> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      taskId: true,
      task: { select: { column: { select: { board: { select: { projectId: true } } } } } },
    },
  });
  if (!comment) return null;
  return {
    projectId: comment.task.column.board.projectId,
    taskId: comment.taskId,
  };
}

export const commentController = {
  async getByTask(req: Request, res: Response, next: NextFunction) {
    try {
      const comments = await commentService.getByTask(param(req, 'taskId'), req.user!.id);
      res.json(successResponse(comments, 'Comments fetched'));
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { content, parentCommentId, mentionedUserIds } = req.body;
      const taskId = param(req, 'taskId');
      const comment = await commentService.create(
        taskId,
        req.user!.id,
        content,
        parentCommentId,
        mentionedUserIds,
      );
      res.status(201).json(successResponse(comment, 'Comment created'));

      const projectId = await getProjectIdFromTask(taskId);
      if (projectId) emitToProject(projectId, 'comment_created', comment);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { content, mentionedUserIds } = req.body;
      const commentId = param(req, 'id');
      const comment = await commentService.update(commentId, req.user!.id, content, mentionedUserIds);
      res.json(successResponse(comment, 'Comment updated'));

      const info = await getProjectIdFromComment(commentId);
      if (info) emitToProject(info.projectId, 'comment_updated', comment);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const commentId = param(req, 'id');
      // Capture info before deletion
      const info = await getProjectIdFromComment(commentId);

      await commentService.delete(commentId, req.user!.id);
      res.json(successResponse(null, 'Comment deleted'));

      if (info) {
        emitToProject(info.projectId, 'comment_deleted', {
          commentId,
          taskId: info.taskId,
        });
      }
    } catch (error) {
      next(error);
    }
  },
};
