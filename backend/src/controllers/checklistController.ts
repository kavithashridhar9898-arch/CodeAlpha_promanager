import { Request, Response, NextFunction } from 'express';
import { checklistService } from '../services/checklistService';
import { successResponse } from '../utils/response';

export const checklistController = {
  async getChecklists(req: Request, res: Response, next: NextFunction) {
    try {
      const checklists = await checklistService.getChecklists(req.params.taskId as string);
      res.json(successResponse(checklists));
    } catch (error) {
      next(error);
    }
  },

  async createChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const { title } = req.body;
      const checklist = await checklistService.createChecklist(req.params.taskId as string, title);
      res.status(201).json(successResponse(checklist));
    } catch (error) {
      next(error);
    }
  },

  async deleteChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      await checklistService.deleteChecklist(req.params.id as string);
      res.json(successResponse(null, 'Checklist deleted'));
    } catch (error) {
      next(error);
    }
  },

  async addChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { content } = req.body;
      const item = await checklistService.addChecklistItem(req.params.id as string, content);
      res.status(201).json(successResponse(item));
    } catch (error) {
      next(error);
    }
  },

  async updateChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { isCompleted, content } = req.body;
      const item = await checklistService.updateChecklistItem(req.params.itemId as string, isCompleted, content);
      res.json(successResponse(item));
    } catch (error) {
      next(error);
    }
  },

  async deleteChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      await checklistService.deleteChecklistItem(req.params.itemId as string);
      res.json(successResponse(null, 'Checklist item deleted'));
    } catch (error) {
      next(error);
    }
  },
};
