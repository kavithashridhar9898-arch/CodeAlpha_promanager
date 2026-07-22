import { Request, Response, NextFunction } from 'express';
import { profileService } from '../services/profileService';
import { successResponse } from '../utils/response';

export const profileController = {
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await profileService.updateProfile(req.user!.id, req.body);
      res.json(successResponse(user, 'Profile updated successfully'));
    } catch (error) {
      next(error);
    }
  },

  async updateAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No image provided' });
        return;
      }
      const user = await profileService.updateAvatar(req.user!.id, req.file);
      res.json(successResponse(user, 'Avatar updated successfully'));
    } catch (error) {
      next(error);
    }
  },

  async deleteAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await profileService.deleteAvatar(req.user!.id);
      res.json(successResponse(user, 'Avatar removed successfully'));
    } catch (error) {
      next(error);
    }
  },
};
