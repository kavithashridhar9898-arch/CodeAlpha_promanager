import prisma from '../../config/database';

export class TimeService {
  /**
   * Manually create a time entry (e.g., past work)
   */
  static async logTime(data: {
    userId: string;
    projectId: string;
    taskId?: string;
    startTime: Date;
    endTime: Date;
    description?: string;
    isBillable?: boolean;
  }) {
    const duration = Math.floor((data.endTime.getTime() - data.startTime.getTime()) / 1000); // seconds
    return prisma.timeEntry.create({
      data: {
        userId: data.userId,
        projectId: data.projectId,
        taskId: data.taskId,
        startTime: data.startTime,
        endTime: data.endTime,
        duration,
        description: data.description,
        isBillable: data.isBillable ?? true,
      }
    });
  }

  static async updateTimeEntry(id: string, data: {
    startTime?: Date;
    endTime?: Date;
    description?: string;
    isBillable?: boolean;
  }) {
    const currentEntry = await prisma.timeEntry.findUnique({ where: { id } });
    if (!currentEntry) throw new Error('Time entry not found');

    const startTime = data.startTime ?? currentEntry.startTime;
    const endTime = data.endTime ?? currentEntry.endTime;
    let duration = currentEntry.duration;
    
    if (endTime) {
      duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    }

    return prisma.timeEntry.update({
      where: { id },
      data: {
        startTime,
        endTime,
        duration,
        description: data.description ?? currentEntry.description,
        isBillable: data.isBillable ?? currentEntry.isBillable
      }
    });
  }

  static async deleteTimeEntry(id: string) {
    return prisma.timeEntry.delete({ where: { id } });
  }

  static async getEntriesForProject(projectId: string) {
    return prisma.timeEntry.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { startTime: 'desc' }
    });
  }
}
