import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcryptjs';

export const securityService = {
  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new AppError('Incorrect current password', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  },

  async getSessions(userId: string) {
    return prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  },

  async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    return prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  },

  async deleteAccount(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  },
};
