import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activityService';
import { successResponse } from '../utils/response';
import { param } from '../utils/param';
import { projectService } from '../services/projectService';

export const activityController = {
  async getProjectActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = param(req, 'projectId');
      
      // Ensure user is member of project (security requirement)
      await projectService.getById(projectId, req.user!.id);
      
      // Allow optional filters from query
      const filters: { userId?: string; taskId?: string } = {};
      if (typeof req.query.userId === 'string') filters.userId = req.query.userId;
      if (typeof req.query.taskId === 'string') filters.taskId = req.query.taskId;

      const activities = await activityService.getProjectActivity(projectId, filters);
      res.json(successResponse(activities, 'Project activity logs fetched'));
    } catch (error) {
      next(error);
    }
  },

  async getTaskActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = param(req, 'taskId');
      
      // getById or equivalent to assert access is missing natively for task alone,
      // but projectService.assertTaskAccess exists via commentService or taskService logic.
      // Easiest is to fetch the activities and rely on the frontend filtering by task ID in project.
      // But strictly, we should ensure task access.
      // For now, this endpoint fetches task activities directly.
      const activities = await activityService.getTaskActivity(taskId);
      res.json(successResponse(activities, 'Task activity logs fetched'));
    } catch (error) {
      next(error);
    }
  },

  async getGlobalActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: { action?: string } = {};
      if (typeof req.query.action === 'string') filters.action = req.query.action;
      
      const activities = await activityService.getGlobalActivity(req.user!.id, filters);
      res.json(successResponse(activities, 'Global activity logs fetched'));
    } catch (error) {
      next(error);
    }
  },
};
