import prisma from '../config/database';
import { AppError } from '../utils/AppError';

export const teamService = {
  async createTeam(userId: string, data: { name: string; description?: string }) {
    return prisma.team.create({
      data: {
        ...data,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
      },
    });
  },

  async getUserTeams(userId: string) {
    return prisma.team.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
      },
    });
  },

  async getTeamById(teamId: string, userId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
      },
    });

    if (!team) throw new AppError('Team not found', 404);

    const isMember = team.members.some((m) => m.userId === userId);
    if (!isMember) throw new AppError('Access denied', 403);

    return team;
  },

  async updateTeam(teamId: string, userId: string, data: { name?: string; description?: string }) {
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });

    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new AppError('Access denied. Admin or Owner required.', 403);
    }

    return prisma.team.update({
      where: { id: teamId },
      data,
    });
  },

  async removeMember(teamId: string, memberId: string, requesterId: string) {
    const requester = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: requesterId, teamId } },
    });
    
    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      throw new AppError('Access denied', 403);
    }

    const memberToRemove = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: memberId, teamId } },
    });

    if (!memberToRemove) throw new AppError('Member not found', 404);
    if (memberToRemove.role === 'OWNER') throw new AppError('Cannot remove owner', 400);

    await prisma.teamMember.delete({
      where: { id: memberToRemove.id },
    });
  },

  async deleteTeam(teamId: string, requesterId: string) {
    const requester = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: requesterId, teamId } },
    });
    
    if (!requester || requester.role !== 'OWNER') {
      throw new AppError('Only the team owner can delete the team', 403);
    }

    await prisma.team.delete({
      where: { id: teamId },
    });
  },

  async addMember(teamId: string, email: string, requesterId: string) {
    const requester = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: requesterId, teamId } },
    });
    
    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN' && requester.role !== 'MANAGER')) {
      throw new AppError('Access denied. Admin or Manager required.', 403);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User with this email not found', 404);

    const existingMember = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: user.id, teamId } },
    });

    if (existingMember) throw new AppError('User is already a member of this team', 400);

    return prisma.teamMember.create({
      data: {
        userId: user.id,
        teamId,
        role: 'MEMBER',
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  },

  async updateMemberRole(teamId: string, memberId: string, newRole: any, requesterId: string) {
    const requester = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: requesterId, teamId } },
    });
    
    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      throw new AppError('Access denied. Admin or Owner required.', 403);
    }

    const memberToUpdate = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: memberId, teamId } },
    });

    if (!memberToUpdate) throw new AppError('Member not found', 404);
    
    if (memberToUpdate.role === 'OWNER' && newRole !== 'OWNER') {
      throw new AppError('Cannot change the role of the team owner', 400);
    }
    
    if (newRole === 'OWNER' && requester.role !== 'OWNER') {
      throw new AppError('Only the current owner can transfer ownership', 403);
    }

    return prisma.teamMember.update({
      where: { id: memberToUpdate.id },
      data: { role: newRole },
    });
  },
};
