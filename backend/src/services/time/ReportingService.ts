import prisma from '../../config/database';

export class ReportingService {
  /**
   * Generates a high-level time tracking report for a project
   */
  static async getProjectTimeReport(projectId: string) {
    const entries = await prisma.timeEntry.findMany({
      where: { projectId },
      include: { user: { select: { name: true } } }
    });

    let totalHours = 0;
    let billableHours = 0;
    let nonBillableHours = 0;
    const userBreakdown: Record<string, number> = {};

    entries.forEach(entry => {
      const hours = (entry.duration || 0) / 3600;
      totalHours += hours;
      
      if (entry.isBillable) {
        billableHours += hours;
      } else {
        nonBillableHours += hours;
      }

      const userName = entry.user.name;
      if (!userBreakdown[userName]) userBreakdown[userName] = 0;
      userBreakdown[userName] += hours;
    });

    return {
      totalHours,
      billableHours,
      nonBillableHours,
      userBreakdown
    };
  }

  /**
   * Save a weekly/monthly snapshot report
   */
  static async generateWorkloadSnapshot(projectId: string, date: Date) {
    // Collect data...
    const reportData = await this.getProjectTimeReport(projectId);
    
    // Save to WorkloadReport table
    // Iterate over users and create snapshots
    for (const [userName, hours] of Object.entries(reportData.userBreakdown)) {
      const user = await prisma.user.findFirst({ where: { name: userName }});
      if (user) {
        await prisma.workloadReport.create({
          data: {
            userId: user.id,
            projectId,
            date,
            totalHours: hours,
            estimatedHours: 40, // Mock for now
            variance: 40 - hours
          }
        });
      }
    }
  }
}
