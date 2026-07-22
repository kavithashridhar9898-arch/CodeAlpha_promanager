import prisma from '../../config/database';

export class TimesheetService {
  /**
   * Fetch user's timesheet data for a given date range
   */
  static async getUserTimesheet(userId: string, startDate: Date, endDate: Date) {
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } }
      },
      orderBy: { startTime: 'desc' }
    });

    // Grouping and aggregation logic can be handled here or on the frontend
    const totalHours = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 3600;

    return { entries, totalHours };
  }

  /**
   * Submit timesheet for approval
   */
  static async submitTimesheet(userId: string, startDate: Date, endDate: Date, totalHours: number) {
    return prisma.timesheet.create({
      data: {
        userId,
        startDate,
        endDate,
        totalHours,
        status: 'SUBMITTED'
      }
    });
  }

  static async updateTimesheetStatus(timesheetId: string, status: 'APPROVED' | 'REJECTED') {
    return prisma.timesheet.update({
      where: { id: timesheetId },
      data: { status }
    });
  }
}
