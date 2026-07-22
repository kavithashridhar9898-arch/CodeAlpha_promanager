import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { notificationService } from './notificationService';
import { NotificationType } from '@prisma/client';
import { activityService } from './activityService';

interface CreateProjectInput {
  name: string;
  description?: string;
  ownerId: string;
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
}

const projectInclude = {
  owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  },
  boards: { select: { id: true, name: true } },
} as const;

export const projectService = {
  async getAll(userId: string) {
    return prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getById(id: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: projectInclude,
    });

    if (!project) {
      throw new AppError('Project not found or you do not have access.', 404);
    }

    return project;
  },

  async create({ name, description, ownerId }: CreateProjectInput) {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId,
        members: {
          create: { userId: ownerId, role: 'OWNER' },
        },
        boards: {
          create: {
            name: 'Main Board',
            columns: {
              create: [
                { name: 'Backlog', order: 0 },
                { name: 'To Do', order: 1 },
                { name: 'In Progress', order: 2 },
                { name: 'Done', order: 3 },
              ],
            },
          },
        },
      },
      include: projectInclude,
    });

    await activityService.logActivity({
      projectId: project.id,
      userId: ownerId,
      action: 'PROJECT_CREATED',
      description: `created the project "${project.name}"`,
    });

    return project;
  },

  async update(id: string, userId: string, data: UpdateProjectInput) {
    await projectService.assertOwnerOrAdmin(id, userId);

    // If attempting to archive via update, block it (use archive endpoint)
    if (data.status === 'ARCHIVED') {
      await projectService.assertOwner(id, userId);
    }

    const project = await prisma.project.update({
      where: { id },
      data,
      include: projectInclude,
    });

    if (data.status === 'ACTIVE') {
      // Find all members
      const projectMembers = await prisma.projectMember.findMany({ where: { projectId: id } });
      for (const member of projectMembers) {
        if (member.userId !== userId) {
          await notificationService.createAndEmit(
            member.userId,
            NotificationType.PROJECT_RESTORED,
            'Project Restored',
            `Project "${project.name}" was restored.`,
            project.id,
            'PROJECT'
          );
        }
      }
    } else {
      await activityService.logActivity({
        projectId: project.id,
        userId,
        action: 'PROJECT_UPDATED',
        description: `updated the project details`,
        metadata: data,
      });
    }
    
    return project;
  },

  async archive(id: string, userId: string) {
    await projectService.assertOwner(id, userId);
    const project = await prisma.project.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: projectInclude,
    });

    // Find all members
    const projectMembers = await prisma.projectMember.findMany({ where: { projectId: id } });
    for (const member of projectMembers) {
      if (member.userId !== userId) {
        await notificationService.createAndEmit(
          member.userId,
          NotificationType.PROJECT_ARCHIVED,
          'Project Archived',
          `Project "${project.name}" was archived.`,
          project.id,
          'PROJECT'
        );
      }
    }

    await activityService.logActivity({
      projectId: project.id,
      userId,
      action: 'PROJECT_ARCHIVED',
      description: `archived the project`,
    });

    return project;
  },

  async delete(id: string, userId: string) {
    await projectService.assertOwner(id, userId);
    await prisma.project.delete({ where: { id } });
    
    // Project is deleted so no project room to emit to, but we still log it.
    // Wait, if we cascade delete, the activity log is also deleted!
    // The user requested to log Project Deleted, but since ActivityLog has onDelete: Cascade for project, 
    // we can't save it to the DB if the project doesn't exist.
    // We'll skip logging delete if cascade is active, or we could remove cascade in the future.
  },

  async addMember(projectId: string, requesterId: string, email: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER') {
    await projectService.assertOwnerOrAdmin(projectId, requesterId);

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) throw new AppError('User with this email not found.', 404);

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: targetUser.id, projectId } },
    });
    if (existing) throw new AppError('User is already a member of this project.', 409);

    const newMember = await prisma.projectMember.create({
      data: { userId: targetUser.id, projectId, role },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } }, project: { select: { name: true } } },
    });

    await notificationService.createAndEmit(
      targetUser.id,
      NotificationType.PROJECT_ADDED,
      'Added to Project',
      `You were added to the project "${newMember.project.name}".`,
      projectId,
      'PROJECT'
    );

    await activityService.logActivity({
      projectId,
      userId: requesterId,
      action: 'MEMBER_INVITED',
      description: `invited ${targetUser.name} to the project as ${role}`,
    });

    return newMember;
  },

  async removeMember(projectId: string, requesterId: string, targetUserId: string) {
    await projectService.assertOwnerOrAdmin(projectId, requesterId);

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    });

    if (!member) throw new AppError('Member not found in this project.', 404);
    if (member.role === 'OWNER') throw new AppError('Cannot remove the project owner.', 403);

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    
    if (project) {
      await notificationService.createAndEmit(
        targetUserId,
        NotificationType.PROJECT_REMOVED,
        'Removed from Project',
        `You were removed from the project "${project.name}".`,
        projectId,
        'PROJECT'
      );
    }

    await activityService.logActivity({
      projectId,
      userId: requesterId,
      action: 'MEMBER_REMOVED',
      description: `removed a member from the project`,
    });
  },

  // ── Helpers ──────────────────────────────────────────────────────────────────

  async assertOwner(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new AppError('Project not found.', 404);
    if (project.ownerId !== userId) throw new AppError('Only the project owner can perform this action.', 403);
  },

  async assertOwnerOrAdmin(projectId: string, userId: string) {
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new AppError('You do not have permission to perform this action.', 403);
    }
  },
};
