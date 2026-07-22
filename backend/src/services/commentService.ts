import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { notificationService } from './notificationService';
import { NotificationType } from '@prisma/client';
import { activityService } from './activityService';

const commentInclude = {
  author: { select: { id: true, name: true, email: true, avatarUrl: true } },
  replies: {
    include: {
      author: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

async function assertCommentOwner(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({ 
    where: { id: commentId },
    include: { task: { include: { column: { include: { board: true } } } } }
  });
  if (!comment) throw new AppError('Comment not found.', 404);
  if (comment.authorId !== userId) throw new AppError('You can only modify your own comments.', 403);
  return { comment, projectId: comment.task.column.board.projectId };
}

async function assertTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { column: { select: { board: { select: { projectId: true } } } }, title: true },
  });
  if (!task) throw new AppError('Task not found.', 404);

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: task.column.board.projectId } },
  });
  if (!member) throw new AppError('Access denied.', 403);
  
  return { task, projectId: task.column.board.projectId };
}

export const commentService = {
  async getByTask(taskId: string, userId: string) {
    await assertTaskAccess(taskId, userId);

    return prisma.comment.findMany({
      where: { taskId, parentCommentId: null },
      include: commentInclude,
      orderBy: { createdAt: 'asc' },
    });
  },

  async getById(id: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        ...commentInclude,
        task: { select: { column: { select: { board: { select: { projectId: true } } } } } }
      }
    });
    if (!comment) throw new AppError('Comment not found.', 404);
    
    // Check if user has access to the project
    await prisma.projectMember.findUniqueOrThrow({
      where: { userId_projectId: { userId, projectId: comment.task.column.board.projectId } }
    }).catch(() => { throw new AppError('Access denied.', 403); });
    
    return comment;
  },

  async create(
    taskId: string,
    authorId: string,
    content: string,
    parentCommentId?: string | null,
    mentionedUserIds?: string[],
  ) {
    const { task, projectId } = await assertTaskAccess(taskId, authorId);

    if (parentCommentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentCommentId } });
      if (!parent || parent.taskId !== taskId) {
        throw new AppError('Parent comment not found on this task.', 404);
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId,
        parentCommentId: parentCommentId ?? null,
        mentionedUserIds: mentionedUserIds && mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
      },
      include: commentInclude,
    });

    const mentionedSet = new Set<string>();
    if (mentionedUserIds && mentionedUserIds.length > 0) {
      for (const uid of mentionedUserIds) {
        if (uid !== authorId) {
          mentionedSet.add(uid);
          await notificationService.createAndEmit(
            uid,
            NotificationType.COMMENT_MENTION,
            'You were mentioned',
            `${comment.author.name} mentioned you in a comment on "${task?.title}".`,
            comment.id,
            'COMMENT'
          );
        }
      }
    }

    const fullTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (fullTask?.assigneeId && fullTask.assigneeId !== authorId && !mentionedSet.has(fullTask.assigneeId)) {
      await notificationService.createAndEmit(
        fullTask.assigneeId,
        NotificationType.TASK_COMMENT,
        'New Comment on Task',
        `${comment.author.name} commented on your assigned task "${task.title}".`,
        comment.id,
        'COMMENT'
      );
    }

    await activityService.logActivity({
      projectId,
      taskId,
      userId: authorId,
      action: 'COMMENT_ADDED',
      description: `commented on task "${task.title}"`,
    });

    return comment;
  },

  async update(id: string, userId: string, content: string, mentionedUserIds?: string[]) {
    const { projectId, comment: oldComment } = await assertCommentOwner(id, userId);
    
    const comment = await prisma.comment.update({
      where: { id },
      data: {
        content,
        mentionedUserIds: mentionedUserIds !== undefined ? mentionedUserIds : undefined,
      },
      include: commentInclude,
    });

    await activityService.logActivity({
      projectId,
      taskId: comment.taskId,
      userId,
      action: 'COMMENT_EDITED',
      description: `edited a comment on task "${oldComment.task.title}"`,
    });

    return comment;
  },

  async delete(id: string, userId: string) {
    const { projectId, comment } = await assertCommentOwner(id, userId);
    
    await prisma.comment.deleteMany({ where: { parentCommentId: id } });
    await prisma.comment.delete({ where: { id } });

    await activityService.logActivity({
      projectId,
      taskId: comment.taskId,
      userId,
      action: 'COMMENT_DELETED',
      description: `deleted a comment on task "${comment.task.title}"`,
    });
  },
};
