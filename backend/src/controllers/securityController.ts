import { Request, Response, NextFunction } from 'express';
import { securityService } from '../services/securityService';
import { successResponse } from '../utils/response';

export const securityController = {
  async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await securityService.updatePassword(req.user!.id, currentPassword, newPassword);
      res.json(successResponse(null, 'Password updated successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const sessions = await securityService.getSessions(req.user!.id);
      res.json(successResponse(sessions, 'Sessions fetched'));
    } catch (error) {
      next(error);
    }
  },

  async revokeSession(req: Request, res: Response, next: NextFunction) {
    try {
      await securityService.revokeSession(req.user!.id, req.params.id as string);
      res.json(successResponse(null, 'Session revoked'));
    } catch (error) {
      next(error);
    }
  },

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      // Typically require password confirmation here
      const { password } = req.body;
      if (!password) {
        throw new Error('Password is required');
      }
      
      await securityService.deleteAccount(req.user!.id);
      res.json(successResponse(null, 'Account deactivated'));
    } catch (error) {
      next(error);
    }
  },
};
