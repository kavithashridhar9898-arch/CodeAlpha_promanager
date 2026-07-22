import prisma from '../../config/database';

export class TimerService {
  /**
   * Starts a new timer. Ensure user doesn't already have a running timer.
   */
  static async startTimer(userId: string, projectId: string, taskId?: string, description?: string) {
    const running = await this.getActiveTimer(userId);
    if (running) {
      throw new Error('A timer is already running. Please stop it first.');
    }

    return prisma.timeEntry.create({
      data: {
        userId,
        projectId,
        taskId,
        startTime: new Date(),
        description,
        isBillable: true,
      }
    });
  }

  static async getActiveTimer(userId: string) {
    return prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null
      }
    });
  }

  static async stopTimer(userId: string) {
    const activeTimer = await this.getActiveTimer(userId);
    if (!activeTimer) throw new Error('No active timer found');

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 1000);

    return prisma.timeEntry.update({
      where: { id: activeTimer.id },
      data: {
        endTime,
        duration
      }
    });
  }

  /**
   * Discards the currently running timer without saving.
   */
  static async discardTimer(userId: string) {
    const activeTimer = await this.getActiveTimer(userId);
    if (activeTimer) {
      await prisma.timeEntry.delete({ where: { id: activeTimer.id } });
    }
  }
}
