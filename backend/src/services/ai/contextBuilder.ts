import prisma from '../../config/database';

export class ContextBuilder {
  static async buildDashboardContext(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedTasks: {
          where: { status: { not: 'DONE' } },
          select: { id: true, title: true, status: true, priority: true, dueDate: true },
          take: 10,
        },
        notifications: {
          where: { isRead: false },
          select: { id: true, title: true, message: true, createdAt: true },
          take: 5,
        },
      },
    });

    const recentProjects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ],
        status: 'ACTIVE'
      },
      select: { id: true, name: true, description: true },
      take: 5,
    });

    return {
      type: 'Dashboard',
      user: {
        name: user?.name,
        role: user?.role,
      },
      assignedTasks: user?.assignedTasks,
      unreadNotifications: user?.notifications,
      activeProjects: recentProjects,
    };
  }

  static async buildProjectContext(projectId: string, userId: string) {
    // Verify user has access to project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, role: true } } } },
        boards: {
          include: {
            columns: {
              include: {
                tasks: {
                  select: { id: true, title: true, status: true, priority: true, dueDate: true, assignee: { select: { name: true } } },
                  take: 20 // limit to avoid huge context
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      throw new Error("Project not found or unauthorized.");
    }

    return {
      type: 'Project',
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
      },
      members: project.members.map((m: any) => m.user.name),
      boards: project.boards.map((b: any) => ({
        name: b.name,
        columns: b.columns.map((c: any) => ({
          name: c.name,
          tasks: c.tasks
        }))
      }))
    };
  }
}
