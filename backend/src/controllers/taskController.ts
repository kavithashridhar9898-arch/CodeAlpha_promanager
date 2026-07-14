import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService';
import { successResponse } from '../utils/response';
import { param } from '../utils/param';
import { emitToProject } from '../socket';
import prisma from '../config/database';

/** Resolve projectId from a taskId (column → board → project) */
async function getProjectIdFromTask(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { column: { select: { board: { select: { projectId: true } } } } },
  });
  return task?.column.board.projectId ?? null;
}

/** Resolve projectId from a columnId (board → project) */
async function getProjectIdFromColumn(columnId: string): Promise<string | null> {
  const col = await prisma.boardColumn.findUnique({
    where: { id: columnId },
    select: { board: { select: { projectId: true } } },
  });
  return col?.board.projectId ?? null;
}

export const taskController = {
  async getByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await taskService.getByProject(param(req, 'projectId'), req.user!.id);
      res.json(successResponse(tasks, 'Tasks fetched'));
    } catch (error) {
      next(error);
    }
  },

  async getFilteredTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.query.projectId as string;
      if (!projectId) {
        return res.status(400).json({ status: 'error', message: 'projectId query param is required' });
      }

      const filters = {
        priority: req.query.priority,
        status: req.query.status,
        assigneeId: req.query.assigneeId,
        dueDate: req.query.dueDate,
        labelId: req.query.labelId,
      };
      const sort = req.query.sort;

      const tasks = await taskService.getFilteredTasks(projectId, req.user!.id, filters, sort);
      res.json(successResponse(tasks, 'Filtered tasks fetched'));
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.getById(param(req, 'id'), req.user!.id);
      res.json(successResponse(task, 'Task fetched'));
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.create(req.body, req.user!.id);
      res.status(201).json(successResponse(task, 'Task created'));

      // Real-time broadcast
      const projectId = await getProjectIdFromColumn(task.columnId);
      if (projectId) emitToProject(projectId, 'task_created', task);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.update(param(req, 'id'), req.user!.id, req.body);
      res.json(successResponse(task, 'Task updated'));

      const projectId = await getProjectIdFromTask(task.id);
      if (projectId) emitToProject(projectId, 'task_updated', task);
    } catch (error) {
      next(error);
    }
  },

  async move(req: Request, res: Response, next: NextFunction) {
    try {
      const { columnId, order } = req.body;
      const task = await taskService.move(param(req, 'id'), req.user!.id, columnId, order);
      res.json(successResponse(task, 'Task moved'));

      if (task) {
        const projectId = await getProjectIdFromTask(task.id);
        if (projectId) {
          emitToProject(projectId, 'task_moved', {
            taskId: task.id,
            columnId,
            order,
            task,
          });
        }
      }
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const task = await taskService.updateStatus(param(req, 'id'), req.user!.id, status);
      res.json(successResponse(task, 'Task status updated'));

      const projectId = await getProjectIdFromTask(task.id);
      if (projectId) emitToProject(projectId, 'task_updated', task);
    } catch (error) {
      next(error);
    }
  },

  async updatePriority(req: Request, res: Response, next: NextFunction) {
    try {
      const { priority } = req.body;
      const task = await taskService.updatePriority(param(req, 'id'), req.user!.id, priority);
      res.json(successResponse(task, 'Task priority updated'));

      const projectId = await getProjectIdFromTask(task.id);
      if (projectId) emitToProject(projectId, 'task_updated', task);
    } catch (error) {
      next(error);
    }
  },

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { assigneeId } = req.body;
      const task = await taskService.updateAssignee(param(req, 'id'), req.user!.id, assigneeId);
      res.json(successResponse(task, 'Task assignee updated'));

      const projectId = await getProjectIdFromTask(task.id);
      if (projectId) emitToProject(projectId, 'task_assigned', task);
    } catch (error) {
      next(error);
    }
  },

  async updateDueDate(req: Request, res: Response, next: NextFunction) {
    try {
      const { dueDate } = req.body;
      const task = await taskService.updateDueDate(param(req, 'id'), req.user!.id, dueDate ? new Date(dueDate) : null);
      res.json(successResponse(task, 'Task due date updated'));

      const projectId = await getProjectIdFromTask(task.id);
      if (projectId) emitToProject(projectId, 'task_updated', task);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      // Capture projectId & columnId before deletion
      const taskId = param(req, 'id');
      const taskInfo = await prisma.task.findUnique({
        where: { id: taskId },
        select: { columnId: true, column: { select: { board: { select: { projectId: true } } } } },
      });

      await taskService.delete(taskId, req.user!.id);
      res.json(successResponse(null, 'Task deleted'));

      if (taskInfo) {
        emitToProject(taskInfo.column.board.projectId, 'task_deleted', {
          taskId,
          columnId: taskInfo.columnId,
        });
      }
    } catch (error) {
      next(error);
    }
  },
};
