import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const analyticsController = {
  // ── Dashboard Overview ──────────────────────────────────────────────────────
  async getDashboardOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      // Find all projects the user is part of
      const userProjects = await prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
        select: { id: true },
      });
      const projectIds = userProjects.map((p) => p.id);

      if (projectIds.length === 0) {
        return res.json({
          data: {
            activeProjects: 0,
            completedTasks: 0,
            pendingTasks: 0,
            overdueTasks: 0,
            upcomingDeadlines: [],
            recentActivity: [],
            recentNotifications: [],
          },
        });
      }

      const activeProjectsCount = await prisma.project.count({
        where: { id: { in: projectIds }, status: 'ACTIVE' },
      });

      const now = new Date();

      const [completedTasks, pendingTasks, overdueTasks] = await Promise.all([
        prisma.task.count({
          where: { column: { board: { projectId: { in: projectIds } } }, status: 'DONE' },
        }),
        prisma.task.count({
          where: { column: { board: { projectId: { in: projectIds } } }, status: { not: 'DONE' } },
        }),
        prisma.task.count({
          where: { column: { board: { projectId: { in: projectIds } } }, status: { not: 'DONE' }, dueDate: { lt: now } },
        }),
      ]);

      const upcomingDeadlines = await prisma.task.findMany({
        where: {
          column: { board: { projectId: { in: projectIds } } },
          status: { not: 'DONE' },
          dueDate: { not: null },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
        include: {
          column: { select: { board: { select: { projectId: true, project: { select: { name: true } } } } } },
        },
      });

      const recentActivity = await prisma.activityLog.findMany({
        where: { projectId: { in: projectIds } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true, avatarUrl: true } } },
      });

      const recentNotifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      res.json({
        data: {
          activeProjects: activeProjectsCount,
          completedTasks,
          pendingTasks,
          overdueTasks,
          upcomingDeadlines,
          recentActivity,
          recentNotifications,
        },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  // ── Detailed Analytics Charts ───────────────────────────────────────────────
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const userProjects = await prisma.project.findMany({
        where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
        select: { id: true, name: true },
      });
      const projectIds = userProjects.map((p) => p.id);

      if (projectIds.length === 0) {
        return res.json({ data: {} });
      }

      // 1. Task Status Distribution
      const statusGroups = await prisma.task.groupBy({
        by: ['status'],
        where: { column: { board: { projectId: { in: projectIds } } } },
        _count: { id: true },
      });
      const statusDistribution = statusGroups.map(g => ({ name: g.status, value: g._count.id }));

      // 2. Task Priority Distribution
      const priorityGroups = await prisma.task.groupBy({
        by: ['priority'],
        where: { column: { board: { projectId: { in: projectIds } } } },
        _count: { id: true },
      });
      const priorityDistribution = priorityGroups.map(g => ({ name: g.priority, value: g._count.id }));

      // 3. Project Progress
      const projectProgress = await Promise.all(userProjects.map(async (project) => {
        const total = await prisma.task.count({ where: { column: { board: { projectId: project.id } } } });
        const completed = await prisma.task.count({ where: { column: { board: { projectId: project.id } }, status: 'DONE' } });
        return { name: project.name, total, completed };
      }));

      // 4. Team Workload
      const assigneeGroups = await prisma.task.groupBy({
        by: ['assigneeId'],
        where: { column: { board: { projectId: { in: projectIds } } }, assigneeId: { not: null } },
        _count: { id: true },
      });
      const userIds = assigneeGroups.map(g => g.assigneeId!);
      const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
      const teamWorkload = assigneeGroups.map(g => ({
        name: users.find(u => u.id === g.assigneeId)?.name || 'Unknown',
        tasks: g._count.id,
      }));

      // 5. Weekly Productivity (Done tasks grouped by day)
      // Since prisma groupBy by Date is complex depending on DB, we'll fetch recently completed tasks and group in memory
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentCompletedTasks = await prisma.task.findMany({
        where: {
          column: { board: { projectId: { in: projectIds } } },
          status: 'DONE',
          updatedAt: { gte: oneWeekAgo },
        },
        select: { updatedAt: true },
      });

      const weeklyMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        weeklyMap[d.toISOString().split('T')[0]] = 0;
      }
      for (const t of recentCompletedTasks) {
        const dateStr = t.updatedAt.toISOString().split('T')[0];
        if (weeklyMap[dateStr] !== undefined) {
          weeklyMap[dateStr]++;
        }
      }
      const weeklyProductivity = Object.keys(weeklyMap).map(date => ({ date, completed: weeklyMap[date] }));

      res.json({
        data: {
          statusDistribution,
          priorityDistribution,
          projectProgress,
          teamWorkload,
          weeklyProductivity,
        },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
};
