import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import crypto from 'crypto';

export const invitationService = {
  async inviteToProject(projectId: string, inviterId: string, email: string, role: any) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) throw new AppError('Project not found', 404);

    const inviter = project.members.find((m) => m.userId === inviterId);
    if (!inviter || (inviter.role !== 'OWNER' && inviter.role !== 'ADMIN')) {
      throw new AppError('Only admins can invite members', 403);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.projectInvitation.create({
      data: {
        email,
        projectId,
        inviterId,
        role,
        token,
        expiresAt,
      },
    });

    // TODO: Actually send an email here using SendGrid or NodeMailer
    console.log(`[Email Simulation] Invitation sent to ${email} with token: ${token}`);

    return invitation;
  },

  async getProjectInvitations(projectId: string) {
    return prisma.projectInvitation.findMany({
      where: { projectId, status: 'PENDING' },
      include: { inviter: { select: { id: true, name: true, email: true } } },
    });
  },

  async getMyInvitations(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    return prisma.projectInvitation.findMany({
      where: { email: user.email, status: 'PENDING' },
      include: { 
        inviter: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async acceptInvitation(token: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const invitation = await prisma.projectInvitation.findUnique({
      where: { token },
    });

    if (!invitation) throw new AppError('Invalid invitation', 404);
    if (invitation.status !== 'PENDING') throw new AppError('Invitation no longer pending', 400);
    if (invitation.expiresAt < new Date()) throw new AppError('Invitation expired', 400);
    
    // In a real app we might strictly match email, but here we just accept if they have the token
    
    await prisma.$transaction([
      prisma.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId,
          role: invitation.role,
        },
      }),
      prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return { success: true };
  },

  async declineInvitation(token: string) {
    const invitation = await prisma.projectInvitation.findUnique({ where: { token } });
    if (!invitation) throw new AppError('Invalid invitation', 404);
    if (invitation.status !== 'PENDING') throw new AppError('Invitation no longer pending', 400);

    await prisma.projectInvitation.update({
      where: { id: invitation.id },
      data: { status: 'DECLINED' },
    });

    return { success: true };
  },
};
