import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { signToken, signRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  notificationSettings: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const authService = {
  async register({ name, email, password }: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('A user with this email already exists.', 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: userSelect,
    });

    const accessToken = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { user, accessToken, refreshToken };
  },

  async login({ email, password }: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const { password: _pw, ...safeUser } = user;
    const accessToken = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { user: safeUser, accessToken, refreshToken };
  },

  async refresh(oldRefreshToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token. Please login again.', 401);
    }

    // Revoke old token to implement token rotation
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = storedToken.user;
    const accessToken = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user.id });

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (storedToken) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
    }
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return user;
  },

  async updateMe(id: string, data: any) {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
    return user;
  },
};
