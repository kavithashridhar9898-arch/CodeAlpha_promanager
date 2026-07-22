import prisma from '../config/database';
import { getIo } from '../socket';

export interface CreateActivityLogInput {
  projectId: string;
  taskId?: string | null;
  userId: string;
  action: string;
  description: string;
  metadata?: any;
}

const logInclude = {
  user: { select: { id: true, name: true, email: true, avatarUrl: true } },
  task: { select: { id: true, title: true } },
  project: { select: { id: true, name: true } },
};

export const activityService = {
  async logActivity(input: CreateActivityLogInput) {
    try {
      const log = await prisma.activityLog.create({
        data: {
          projectId: input.projectId,
          taskId: input.taskId || null,
          userId: input.userId,
          action: input.action,
          description: input.description,
          metadata: input.metadata || null,
        },
        include: logInclude,
      });

      // Emit real-time event to the project room
      const io = getIo();
      io.to(`project:${input.projectId}`).emit('activity_created', log);

      return log;
    } catch (error) {
      console.error('Error logging activity:', error);
      // We don't throw the error so that main business logic isn't blocked if logging fails
      return null;
    }
  },

  async getProjectActivity(projectId: string, filters?: { userId?: string; taskId?: string }) {
    const where: any = { projectId };
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.taskId) where.taskId = filters.taskId;

    return prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: logInclude,
    });
  },

  async getTaskActivity(taskId: string) {
    return prisma.activityLog.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: logInclude,
    });
  },

  async getGlobalActivity(userId: string, filters?: { action?: string }) {
    const where: any = {
      project: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      }
    };
    if (filters?.action) where.action = filters.action;

    return prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to 100 recent entries for performance
      include: logInclude,
    });
  }
};
