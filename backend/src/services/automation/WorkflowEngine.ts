import prisma from '../../config/database';
import { ActionExecutor } from './ActionExecutor';
import { ConditionEvaluator } from './ConditionEvaluator';

export class WorkflowEngine {
  
  static async executeWorkflow(automationId: string, triggerData: any) {
    // 1. Fetch automation with nodes and edges
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
      include: {
        nodes: true,
        edges: true,
      }
    });

    if (!automation || !automation.isActive) {
      console.log(`Automation ${automationId} is not active or not found.`);
      return;
    }

    // 2. Create Execution Record
    const execution = await prisma.automationExecution.create({
      data: {
        automationId,
        status: 'RUNNING',
        triggerData: triggerData || {},
      }
    });

    try {
      // 3. Find the Trigger Node
      const triggerNode = automation.nodes.find((n: any) => n.type === 'TRIGGER');
      if (!triggerNode) {
        throw new Error('No trigger node found for automation');
      }

      // 4. Start BFS / DFS traversal
      await this.processNode(triggerNode, triggerData, automation, execution.id);

      // 5. Update Execution Record
      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          durationMs: Date.now() - execution.startedAt.getTime()
        }
      });
      
    } catch (error: any) {
      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          durationMs: Date.now() - execution.startedAt.getTime()
        }
      });
      console.error(`Workflow ${automationId} failed:`, error);
    }
  }

  private static async processNode(currentNode: any, contextData: any, automation: any, executionId: string) {
    try {
      // Process current node
      if (currentNode.type === 'CONDITION') {
        const passed = await ConditionEvaluator.evaluate(currentNode.config, contextData);
        await prisma.automationLog.create({
          data: {
            executionId,
            nodeId: currentNode.id,
            status: passed ? 'SUCCESS' : 'FAILED',
            message: `Condition evaluated to ${passed}`
          }
        });
        
        // If condition failed, stop this branch
        if (!passed) return;
        
      } else if (currentNode.type === 'ACTION') {
        const result = await ActionExecutor.execute(currentNode.subType, currentNode.config, contextData, automation.projectId);
        await prisma.automationLog.create({
          data: {
            executionId,
            nodeId: currentNode.id,
            status: 'SUCCESS',
            message: `Action ${currentNode.subType} executed successfully`
          }
        });
        
        // Merge action result into contextData for downstream nodes
        contextData = { ...contextData, [currentNode.id]: result };
      }

      // Find children
      const outgoingEdges = automation.edges.filter((e: any) => e.sourceId === currentNode.id);
      
      for (const edge of outgoingEdges) {
        const targetNode = automation.nodes.find((n: any) => n.id === edge.targetId);
        if (targetNode) {
          await this.processNode(targetNode, contextData, automation, executionId);
        }
      }
    } catch (error: any) {
       await prisma.automationLog.create({
          data: {
            executionId,
            nodeId: currentNode.id,
            status: 'FAILED',
            error: error.message
          }
        });
        throw error; // stop execution
    }
  }
}
