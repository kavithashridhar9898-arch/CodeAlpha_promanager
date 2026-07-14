import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';
import { successResponse } from '../utils/response';
import { param } from '../utils/param';

export const notificationController = {
  async getForUser(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationService.getForUser(req.user!.id);
      res.json(successResponse(notifications, 'Notifications fetched'));
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.markAsRead(param(req, 'id'), req.user!.id);
      res.json(successResponse(notification, 'Notification marked as read'));
    } catch (error) {
      next(error);
    }
  },

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(req.user!.id);
      res.json(successResponse(null, 'All notifications marked as read'));
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.delete(param(req, 'id'), req.user!.id);
      res.json(successResponse(null, 'Notification deleted'));
    } catch (error) {
      next(error);
    }
  },
};
