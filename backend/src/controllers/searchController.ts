import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const searchController = {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const query = req.query.q as string;

      if (!query || query.trim() === '') {
        return res.json({ data: { projects: [], tasks: [], users: [], comments: [] } });
      }

      const userProjects = await prisma.project.findMany({
        where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
        select: { id: true },
      });
      const projectIds = userProjects.map((p) => p.id);

      if (projectIds.length === 0) {
        return res.json({ data: { projects: [], tasks: [], users: [], comments: [] } });
      }

      // Search Projects
      const projects = await prisma.project.findMany({
        where: {
          id: { in: projectIds },
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: 5,
        select: { id: true, name: true, description: true },
      });

      // Search Tasks
      const tasks = await prisma.task.findMany({
        where: {
          column: { board: { projectId: { in: projectIds } } },
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          column: { select: { board: { select: { projectId: true, project: { select: { name: true } } } } } },
        },
      });

      // Search Users (within project members)
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId: { in: projectIds } },
        select: { userId: true },
      });
      const memberUserIds = Array.from(new Set(projectMembers.map((m) => m.userId)));

      const users = await prisma.user.findMany({
        where: {
          id: { in: memberUserIds },
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
          ],
        },
        take: 5,
        select: { id: true, name: true, email: true, avatarUrl: true },
      });

      // Search Comments
      const comments = await prisma.comment.findMany({
        where: {
          task: { column: { board: { projectId: { in: projectIds } } } },
          content: { contains: query },
        },
        take: 5,
        select: {
          id: true,
          content: true,
          task: { select: { id: true, title: true, column: { select: { board: { select: { projectId: true } } } } } },
        },
      });

      res.json({
        data: {
          projects,
          tasks,
          users,
          comments,
        },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
};
