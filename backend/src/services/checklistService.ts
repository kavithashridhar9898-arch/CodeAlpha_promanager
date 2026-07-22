import prisma from '../config/database';

export const checklistService = {
  async getChecklists(taskId: string) {
    return prisma.checklist.findMany({
      where: { taskId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async createChecklist(taskId: string, title: string) {
    return prisma.checklist.create({
      data: { taskId, title },
      include: { items: true },
    });
  },

  async deleteChecklist(id: string) {
    return prisma.checklist.delete({ where: { id } });
  },

  async addChecklistItem(checklistId: string, content: string) {
    return prisma.checklistItem.create({
      data: { checklistId, content },
    });
  },

  async updateChecklistItem(id: string, isCompleted?: boolean, content?: string) {
    return prisma.checklistItem.update({
      where: { id },
      data: { isCompleted, content },
    });
  },

  async deleteChecklistItem(id: string) {
    return prisma.checklistItem.delete({ where: { id } });
  },
};
