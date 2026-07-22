import * as cron from 'node-cron';
import prisma from '../../config/database';
import { WorkflowEngine } from './WorkflowEngine';

export class Scheduler {
  private static tasks = new Map<string, cron.ScheduledTask>();

  static async init() {
    // Load all active scheduled automations from DB
    const automations = await prisma.automation.findMany({
      where: { isActive: true },
      include: {
        nodes: {
          where: { type: 'TRIGGER', subType: 'SCHEDULE' }
        }
      }
    });

    for (const automation of automations) {
      if (automation.nodes.length > 0) {
        this.scheduleAutomation(automation.id, automation.nodes[0].config);
      }
    }
  }

  static scheduleAutomation(automationId: string, config: any) {
    // Clear existing if any
    this.removeSchedule(automationId);

    const cronExpression = config.cronExpression;
    if (!cronExpression || !cron.validate(cronExpression)) {
      console.error(`Invalid cron expression for automation ${automationId}`);
      return;
    }

    const task = cron.schedule(cronExpression, () => {
      console.log(`Executing scheduled automation ${automationId}`);
      WorkflowEngine.executeWorkflow(automationId, { event: 'SCHEDULE', timestamp: new Date() })
        .catch(err => console.error(err));
    });

    this.tasks.set(automationId, task);
  }

  static removeSchedule(automationId: string) {
    const task = this.tasks.get(automationId);
    if (task) {
      task.stop();
      this.tasks.delete(automationId);
    }
  }
}
