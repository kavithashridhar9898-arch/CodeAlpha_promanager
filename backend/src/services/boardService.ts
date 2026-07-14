import prisma from '../config/database';
import { AppError } from '../utils/AppError';

export const boardService = {
  async getByProject(projectId: string, userId: string) {
    // 1. Verify user is part of the project
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    
    if (!member) {
      // Check if they are the owner
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project || project.ownerId !== userId) {
        throw new AppError('You do not have permission to view this board.', 403);
      }
    }

    // 2. Fetch the first board (since each project has one default board)
    let board = await prisma.board.findFirst({
      where: { projectId },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
                labels: { include: { label: true } },
                _count: { select: { comments: true } }
              },
            },
          },
        },
      },
    });

    if (!board) {
      // Lazily create the board for legacy projects
      board = await prisma.board.create({
        data: {
          name: 'Main Board',
          projectId: projectId,
          columns: {
            create: [
              { name: 'Backlog', order: 0 },
              { name: 'To Do', order: 1 },
              { name: 'In Progress', order: 2 },
              { name: 'Done', order: 3 },
            ],
          },
        },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            include: {
              tasks: {
                orderBy: { order: 'asc' },
                include: {
                  assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
                  labels: { include: { label: true } },
                  _count: { select: { comments: true } }
                },
              },
            },
          },
        },
      });
    }

    return board;
  },
};
