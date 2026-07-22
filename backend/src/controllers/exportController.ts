import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';

/** Convert array of objects to CSV string */
function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return '';
    const str = String(v);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.join(','), ...rows.map((r) => r.map(escape).join(','))];
  return lines.join('\n');
}

export const exportController = {
  /** Export all tasks in a project as CSV */
  async exportTasksCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id as string;

      // Verify access
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: req.user!.id },
            { members: { some: { userId: req.user!.id } } },
          ],
        },
        include: {
          boards: {
            include: {
              columns: {
                include: {
                  tasks: {
                    include: {
                      assignee: { select: { name: true, email: true } },
                      labels: { include: { label: true } },
                      _count: { select: { comments: true, checklists: true } },
                    },
                    orderBy: { order: 'asc' },
                  },
                },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      if (!project) throw new AppError('Project not found or access denied', 404);

      const headers = ['ID', 'Title', 'Status', 'Priority', 'Column', 'Assignee', 'Labels', 'Due Date', 'Comments', 'Checklists', 'Created At'];
      const rows: (string | number | null)[][] = [];

      for (const board of project.boards) {
        for (const col of board.columns) {
          for (const task of col.tasks) {
            rows.push([
              task.id,
              task.title,
              task.status,
              task.priority,
              col.name,
              task.assignee ? `${task.assignee.name} <${task.assignee.email}>` : '',
              task.labels.map((l) => l.label.name).join('; '),
              task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
              task._count.comments,
              task._count.checklists,
              task.createdAt.toISOString().split('T')[0],
            ]);
          }
        }
      }

      const csv = toCSV(headers, rows);
      const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_tasks_${Date.now()}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  },

  /** Export project summary as JSON */
  async exportProjectJSON(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id as string;

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: req.user!.id },
            { members: { some: { userId: req.user!.id } } },
          ],
        },
        include: {
          owner: { select: { name: true, email: true } },
          members: { include: { user: { select: { name: true, email: true } } } },
          boards: {
            include: {
              columns: {
                include: {
                  tasks: {
                    include: {
                      assignee: { select: { name: true, email: true } },
                      labels: { include: { label: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!project) throw new AppError('Project not found or access denied', 404);

      const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_export_${Date.now()}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json({ exportedAt: new Date().toISOString(), project });
    } catch (error) {
      next(error);
    }
  },
};
