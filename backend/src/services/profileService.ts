import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import * as fs from 'fs';
import * as path from 'path';

export const profileService = {
  async updateProfile(userId: string, data: { name?: string; username?: string; phone?: string; jobTitle?: string; bio?: string; timezone?: string; language?: string; theme?: string; dateFormat?: string }) {
    // Check if username is already taken
    if (data.username) {
      const existing = await prisma.user.findUnique({ where: { username: data.username } });
      if (existing && existing.id !== userId) {
        throw new AppError('Username is already taken.', 400);
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        jobTitle: true,
        bio: true,
        avatarUrl: true,
        role: true,
        timezone: true,
        language: true,
        theme: true,
        dateFormat: true,
        createdAt: true,
      },
    });
  },

  async updateAvatar(userId: string, file: Express.Multer.File) {
    // Save image path relative to public folder so client can fetch it via /uploads/avatars/...
    const avatarUrl = `/uploads/avatars/${file.filename}`;

    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });
  },

  async deleteAvatar(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (user?.avatarUrl) {
      // Note: In a real app we'd delete the file.
      const filePath = path.join(__dirname, '../../public', user.avatarUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: { id: true, avatarUrl: true },
    });
  },
};
