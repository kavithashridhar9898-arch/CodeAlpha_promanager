import prisma from '../../config/database';
import { WorkflowEngine } from './WorkflowEngine';

export class TriggerService {
  
  /**
   * Handles incoming events from the system (e.g., 'TASK_CREATED')
   * @param eventType e.g., 'TASK_CREATED', 'TASK_UPDATED'
   * @param payload The data associated with the event (e.g., the created task object)
   * @param projectId The project context
   */
  static async handleEvent(eventType: string, payload: any, projectId: string) {
    try {
      // Find all active automations in the project
      const automations = await prisma.automation.findMany({
        where: {
          projectId,
          isActive: true
        },
        include: {
          nodes: true
        }
      });

      for (const automation of automations) {
        // Find trigger nodes matching this event
        const triggerNodes = automation.nodes.filter(
          (n: any) => n.type === 'TRIGGER' && n.subType === eventType
        );

        if (triggerNodes.length > 0) {
          // If we want to be more specific, we could evaluate conditions on the trigger itself here
          // For now, we execute the workflow
          console.log(`Triggering automation ${automation.id} for event ${eventType}`);
          
          // Execute asynchronously (fire and forget)
          // In a production setup, this would go into BullMQ
          WorkflowEngine.executeWorkflow(automation.id, {
            event: eventType,
            ...payload // e.g., { task: { id: '...', title: '...' } }
          }).catch(err => console.error('Workflow error:', err));
        }
      }
    } catch (error) {
      console.error('TriggerService error:', error);
    }
  }
}
