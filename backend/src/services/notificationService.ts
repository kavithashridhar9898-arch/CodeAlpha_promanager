import prisma from '../config/database';
import { emitToUser } from '../socket';
import { NotificationType } from '../generated/prisma';
import { activityService } from './activityService';

export const notificationService = {
  async getForUser(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });

    // Try to resolve projectId to log the activity
    if (notification.referenceId) {
      let projectId: string | null = null;
      let taskId: string | null = null;
      
      if (notification.referenceType === 'PROJECT') {
        projectId = notification.referenceId;
      } else if (notification.referenceType === 'TASK') {
        const task = await prisma.task.findUnique({
          where: { id: notification.referenceId },
          select: { column: { select: { board: { select: { projectId: true } } } } }
        });
        if (task) {
          projectId = task.column.board.projectId;
          taskId = notification.referenceId;
        }
      } else if (notification.referenceType === 'COMMENT') {
        const comment = await prisma.comment.findUnique({
          where: { id: notification.referenceId },
          select: { task: { select: { id: true, column: { select: { board: { select: { projectId: true } } } } } } }
        });
        if (comment) {
          projectId = comment.task.column.board.projectId;
          taskId = comment.task.id;
        }
      }

      if (projectId) {
        await activityService.logActivity({
          projectId,
          taskId,
          userId,
          action: 'NOTIFICATION_READ',
          description: `read notification: ${notification.title}`,
        });
      }
    }

    return notification;
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    // Not logging "Mark All As Read" per project since it spans multiple projects.
  },

  async delete(id: string, userId: string) {
    return prisma.notification.delete({
      where: { id, userId },
    });
  },

  async createAndEmit(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    referenceId?: string,
    referenceType?: string
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        referenceId,
        referenceType,
      },
    });

    emitToUser(userId, 'notification_new', notification);

    return notification;
  },
};
