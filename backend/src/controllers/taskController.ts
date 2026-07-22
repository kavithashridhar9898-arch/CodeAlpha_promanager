import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService';
import { successResponse } from '../utils/response';
import { param } from '../utils/param';
import { emitToProject } from '../socket';
import prisma from '../config/database';
import { TriggerService } from '../services/automation/TriggerService';

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
  async getCalendarTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      // Find all projects where user is a member or owner
      const memberships = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });
      const ownedProjects = await prisma.project.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const projectIds = [
        ...new Set([
          ...memberships.map((m) => m.projectId),
          ...ownedProjects.map((p) => p.id),
        ]),
      ];

      const tasks = await prisma.task.findMany({
        where: {
          dueDate: { not: null },
          column: { board: { projectId: { in: projectIds } } },
        },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          labels: { include: { label: true } },
          column: {
            include: { board: { include: { project: { select: { id: true, name: true } } } } },
          },
          _count: { select: { comments: true } },
        },
        orderBy: { dueDate: 'asc' },
      });

      // Shape: flatten project info into task
      const shaped = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        order: t.order,
        columnId: t.columnId,
        assignee: t.assignee,
        labels: t.labels,
        _count: t._count,
        projectId: t.column.board.projectId,
        projectName: t.column.board.project.name,
      }));

      res.json(successResponse(shaped, 'Calendar tasks fetched'));
    } catch (error) {
      next(error);
    }
  },

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
      if (projectId) {
        emitToProject(projectId, 'task_created', task);
        TriggerService.handleEvent('TASK_CREATED', { task }, projectId);
      }
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.update(param(req, 'id'), req.user!.id, req.body);
      res.json(successResponse(task, 'Task updated'));

      const projectId = await getProjectIdFromTask(task.id);
      if (projectId) {
        emitToProject(projectId, 'task_updated', task);
        TriggerService.handleEvent('TASK_UPDATED', { task }, projectId);
      }
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
      if (projectId) {
        emitToProject(projectId, 'task_updated', task);
        TriggerService.handleEvent('TASK_STATUS_CHANGED', { task }, projectId);
      }
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
      if (projectId) {
        emitToProject(projectId, 'task_assigned', task);
        TriggerService.handleEvent('TASK_ASSIGNED', { task }, projectId);
      }
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
