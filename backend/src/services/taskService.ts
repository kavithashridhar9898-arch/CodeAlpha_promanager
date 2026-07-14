import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { notificationService } from './notificationService';
import { NotificationType } from '../generated/prisma';
import { activityService } from './activityService';

interface CreateTaskInput {
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assigneeId?: string;
  columnId: string;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string | null;
  assigneeId?: string | null;
  columnId?: string;
}

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
  column: { select: { id: true, name: true, boardId: true } },
  comments: {
    include: {
      author: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  labels: { include: { label: true } },
  _count: { select: { comments: true } },
} as const;

async function assertProjectAccess(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!member) throw new AppError('Project not found or access denied.', 403);
}

async function assertColumnAccess(columnId: string, userId: string) {
  const column = await prisma.boardColumn.findUnique({
    where: { id: columnId },
    select: { board: { select: { projectId: true } }, name: true },
  });
  if (!column) throw new AppError('Column not found.', 404);
  await assertProjectAccess(column.board.projectId, userId);
  return column;
}

async function assertTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { column: { select: { board: { select: { projectId: true } } } }, title: true },
  });
  if (!task) throw new AppError('Task not found.', 404);
  await assertProjectAccess(task.column.board.projectId, userId);
  return { task, projectId: task.column.board.projectId };
}

export const taskService = {
  async getByProject(projectId: string, userId: string) {
    await assertProjectAccess(projectId, userId);
    return prisma.task.findMany({
      where: {
        column: {
          board: {
            projectId,
          },
        },
      },
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  async getFilteredTasks(projectId: string, userId: string, filters: any, sort: any) {
    await assertProjectAccess(projectId, userId);

    const whereClause: any = {
      column: { board: { projectId } },
    };

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.assigneeId) {
      whereClause.assigneeId = filters.assigneeId;
    }
    if (filters.dueDate) {
      // Due Date can be a specific date or ranges, let's keep it simple: matches day if provided
      const date = new Date(filters.dueDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      whereClause.dueDate = {
        gte: date,
        lt: nextDay,
      };
    }
    if (filters.labelId) {
      whereClause.labels = { some: { labelId: filters.labelId } };
    }

    let orderByClause: any = { order: 'asc' };
    if (sort) {
      if (sort === 'NEWEST') orderByClause = { createdAt: 'desc' };
      else if (sort === 'OLDEST') orderByClause = { createdAt: 'asc' };
      else if (sort === 'PRIORITY') orderByClause = { priority: 'desc' };
      else if (sort === 'DUE_DATE') orderByClause = { dueDate: 'asc' };
      else if (sort === 'RECENTLY_UPDATED') orderByClause = { updatedAt: 'desc' };
    }

    return prisma.task.findMany({
      where: whereClause,
      include: taskInclude,
      orderBy: orderByClause,
    });
  },

  async getById(id: string, userId: string) {
    await assertTaskAccess(id, userId);
    const task = await prisma.task.findUnique({ where: { id }, include: taskInclude });
    if (!task) throw new AppError('Task not found.', 404);
    return task;
  },

  async create(input: CreateTaskInput, userId: string) {
    const column = await assertColumnAccess(input.columnId, userId);
    
    const count = await prisma.task.count({ where: { columnId: input.columnId } });

    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        status: input.status ?? 'TODO',
        priority: input.priority ?? 'MEDIUM',
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        columnId: input.columnId,
        assigneeId: input.assigneeId,
        order: count,
      },
      include: taskInclude,
    });

    await activityService.logActivity({
      projectId: column.board.projectId,
      taskId: task.id,
      userId,
      action: 'TASK_CREATED',
      description: `created task "${task.title}"`,
    });

    return task;
  },

  async update(id: string, userId: string, data: UpdateTaskInput) {
    const { projectId } = await assertTaskAccess(id, userId);
    if (data.columnId) {
      await assertColumnAccess(data.columnId, userId);
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
      },
      include: taskInclude,
    });

    await activityService.logActivity({
      projectId,
      taskId: task.id,
      userId,
      action: 'TASK_UPDATED',
      description: `updated task "${task.title}"`,
      metadata: data,
    });

    return task;
  },

  async move(id: string, userId: string, newColumnId: string, newOrder: number) {
    const { projectId, task: originalTaskInfo } = await assertTaskAccess(id, userId);
    const newColumn = await assertColumnAccess(newColumnId, userId);

    const task = await prisma.task.findUnique({ where: { id }, include: { column: true } });
    if (!task) throw new AppError('Task not found.', 404);

    const oldColumnId = task.columnId;
    const oldOrder = task.order;
    const oldColumnName = task.column.name;

    await prisma.$transaction(async (tx) => {
      if (oldColumnId === newColumnId) {
        if (oldOrder < newOrder) {
          await tx.task.updateMany({
            where: { columnId: newColumnId, order: { gt: oldOrder, lte: newOrder } },
            data: { order: { decrement: 1 } },
          });
        } else if (oldOrder > newOrder) {
          await tx.task.updateMany({
            where: { columnId: newColumnId, order: { gte: newOrder, lt: oldOrder } },
            data: { order: { increment: 1 } },
          });
        }
      } else {
        await tx.task.updateMany({
          where: { columnId: oldColumnId, order: { gt: oldOrder } },
          data: { order: { decrement: 1 } },
        });

        await tx.task.updateMany({
          where: { columnId: newColumnId, order: { gte: newOrder } },
          data: { order: { increment: 1 } },
        });
      }

      await tx.task.update({
        where: { id },
        data: { columnId: newColumnId, order: newOrder },
      });
    });

    const updatedTask = await prisma.task.findUnique({ where: { id }, include: taskInclude });

    if (oldColumnId !== newColumnId) {
      await activityService.logActivity({
        projectId,
        taskId: id,
        userId,
        action: 'TASK_MOVED',
        description: `moved task "${originalTaskInfo.title}" from ${oldColumnName} to ${newColumn.name}`,
      });
    }

    return updatedTask;
  },

  async updateStatus(id: string, userId: string, status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE') {
    const { projectId } = await assertTaskAccess(id, userId);
    const task = await prisma.task.update({
      where: { id },
      data: { status },
      include: taskInclude,
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      await notificationService.createAndEmit(
        task.assigneeId,
        NotificationType.TASK_STATUS_CHANGED,
        'Task Status Changed',
        `Task "${task.title}" was moved to ${status}.`,
        task.id,
        'TASK'
      );
    }

    await activityService.logActivity({
      projectId,
      taskId: task.id,
      userId,
      action: 'TASK_STATUS_CHANGED',
      description: `changed status of task "${task.title}" to ${status}`,
    });

    return task;
  },

  async updatePriority(id: string, userId: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') {
    const { projectId } = await assertTaskAccess(id, userId);
    const task = await prisma.task.update({
      where: { id },
      data: { priority },
      include: taskInclude,
    });

    await activityService.logActivity({
      projectId,
      taskId: task.id,
      userId,
      action: 'TASK_PRIORITY_CHANGED',
      description: `changed priority of task "${task.title}" to ${priority}`,
    });

    return task;
  },

  async updateAssignee(id: string, userId: string, assigneeId: string | null) {
    const { projectId } = await assertTaskAccess(id, userId);
    const oldTask = await prisma.task.findUnique({ where: { id } });
    const task = await prisma.task.update({
      where: { id },
      data: { assigneeId },
      include: taskInclude,
    });

    if (assigneeId && assigneeId !== userId) {
      await notificationService.createAndEmit(
        assigneeId,
        NotificationType.TASK_ASSIGNED,
        'Task Assigned',
        `You have been assigned to task "${task.title}".`,
        task.id,
        'TASK'
      );
    }
    
    if (oldTask?.assigneeId && !assigneeId && oldTask.assigneeId !== userId) {
      await notificationService.createAndEmit(
        oldTask.assigneeId,
        NotificationType.TASK_UNASSIGNED,
        'Task Unassigned',
        `You have been unassigned from task "${task.title}".`,
        task.id,
        'TASK'
      );
    }

    if (assigneeId && task.assignee) {
      await activityService.logActivity({
        projectId,
        taskId: task.id,
        userId,
        action: 'TASK_ASSIGNED',
        description: `assigned task "${task.title}" to ${task.assignee.name}`,
      });
    } else if (!assigneeId) {
      await activityService.logActivity({
        projectId,
        taskId: task.id,
        userId,
        action: 'TASK_UNASSIGNED',
        description: `unassigned task "${task.title}"`,
      });
    }

    return task;
  },

  async updateDueDate(id: string, userId: string, dueDate: Date | null) {
    const { projectId } = await assertTaskAccess(id, userId);
    const task = await prisma.task.update({
      where: { id },
      data: { dueDate },
      include: taskInclude,
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      await notificationService.createAndEmit(
        task.assigneeId,
        NotificationType.TASK_DUE_DATE_CHANGED,
        'Due Date Updated',
        `The due date for "${task.title}" was updated.`,
        task.id,
        'TASK'
      );
    }

    await activityService.logActivity({
      projectId,
      taskId: task.id,
      userId,
      action: 'TASK_DUE_DATE_CHANGED',
      description: `changed due date of task "${task.title}"`,
    });

    return task;
  },

  async delete(id: string, userId: string) {
    const { projectId, task: originalTaskInfo } = await assertTaskAccess(id, userId);
    const task = await prisma.task.findUnique({ where: { id } });
    if (task) {
      await prisma.$transaction(async (tx) => {
        await tx.task.delete({ where: { id } });
        await tx.task.updateMany({
          where: { columnId: task.columnId, order: { gt: task.order } },
          data: { order: { decrement: 1 } },
        });
      });
      
      // We skip emitting if onDelete: Cascade cascades the activity log, 
      // but if the task is set to `taskId: null` or it cascades...
      // Wait, ActivityLog has `task Task? @relation(..., onDelete: Cascade)`.
      // If task is deleted, the log will be deleted. So no point logging here unless we change it to SetNull!
      // I will remove onDelete: Cascade from `task` relation in schema if they want logs to persist.
      // But for now I'll write the log. It'll just get cascaded if it runs before, or fail if we pass the taskId.
      // Actually, if we pass taskId after it's deleted it'll fail FK. If we pass taskId = null it works!
      await activityService.logActivity({
        projectId,
        taskId: null, // intentionally null so it doesn't get cascade deleted or fail FK
        userId,
        action: 'TASK_DELETED',
        description: `deleted task "${originalTaskInfo.title}"`,
      });
    }
  },
};
