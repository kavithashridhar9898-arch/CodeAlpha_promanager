import prisma from '../../config/database';

export class ResourceService {
  /**
   * Allocate hours for a user on a specific day for a project/task
   */
  static async allocateResource(data: {
    userId: string;
    projectId: string;
    taskId?: string;
    date: Date;
    allocatedHours: number;
  }) {
    return prisma.resourceAllocation.create({
      data: {
        userId: data.userId,
        projectId: data.projectId,
        taskId: data.taskId,
        date: data.date,
        allocatedHours: data.allocatedHours,
      }
    });
  }

  /**
   * Get the workload for a team/project over a date range
   */
  static async getWorkload(projectId: string, startDate: Date, endDate: Date) {
    const allocations = await prisma.resourceAllocation.findMany({
      where: {
        projectId,
        date: { gte: startDate, lte: endDate }
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    // Compute actuals vs estimates
    // In a full implementation, you'd join with TimeEntry for actuals.
    return allocations;
  }

  /**
   * Check if a user is overallocated on a given date (e.g., > 8 hours)
   */
  static async checkCapacity(userId: string, date: Date) {
    const allocations = await prisma.resourceAllocation.findMany({
      where: { userId, date }
    });

    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocatedHours, 0);
    return {
      userId,
      date,
      totalAllocated,
      isOverallocated: totalAllocated > 8
    };
  }
}
