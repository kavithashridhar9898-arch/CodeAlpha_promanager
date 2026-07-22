import prisma from '../../config/database';
import axios from 'axios';

export class ActionExecutor {
  
  static async execute(subType: string, config: any, contextData: any, projectId: string): Promise<any> {
    switch (subType) {
      case 'ASSIGN_USER':
        return this.assignUser(config, contextData);
      case 'CHANGE_STATUS':
        return this.changeStatus(config, contextData);
      case 'CREATE_TASK':
        return this.createTask(config, projectId, contextData);
      case 'SEND_NOTIFICATION':
        return this.sendNotification(config, contextData);
      case 'CALL_WEBHOOK':
        return this.callWebhook(config, contextData);
      default:
        throw new Error(`Unsupported action subtype: ${subType}`);
    }
  }

  private static async assignUser(config: any, contextData: any) {
    const taskId = contextData.task?.id;
    const assigneeId = config.assigneeId; // Or dynamic from context if configured
    
    if (!taskId || !assigneeId) throw new Error('Missing taskId or assigneeId for ASSIGN_USER');

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId }
    });
    return updated;
  }

  private static async changeStatus(config: any, contextData: any) {
    const taskId = contextData.task?.id;
    const status = config.status; 
    
    if (!taskId || !status) throw new Error('Missing taskId or status for CHANGE_STATUS');

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status }
    });
    return updated;
  }

  private static async createTask(config: any, _projectId: string, _contextData: any) {
    // Dynamic text replacement for title/description could go here
    const { title, description, columnId, priority } = config;
    if (!title || !columnId) throw new Error('Missing required task fields');

    const task = await prisma.task.create({
      data: {
        title,
        description,
        columnId,
        priority: priority || 'MEDIUM'
      }
    });
    return task;
  }

  private static async sendNotification(config: any, _contextData: any) {
    const { userId, title, message, type } = config;
    if (!userId) throw new Error('Missing userId for SEND_NOTIFICATION');

    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'SYSTEM_ALERT',
      }
    });
    return { success: true };
  }

  private static async callWebhook(config: any, contextData: any) {
    const { url, method = 'POST', headers = {}, payload } = config;
    if (!url) throw new Error('Missing webhook URL');

    const response = await axios({
      method,
      url,
      headers,
      data: payload || contextData
    });
    
    return response.data;
  }
}
