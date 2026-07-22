import { Request, Response, NextFunction } from 'express';
import { attachmentService } from '../services/attachmentService';
import { successResponse } from '../utils/response';

export const attachmentController = {
  async uploadAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file provided' });
        return;
      }
      const attachment = await attachmentService.uploadAttachment(req.params.taskId as string, req.file);
      res.status(201).json(successResponse(attachment, 'File uploaded successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getTaskAttachments(req: Request, res: Response, next: NextFunction) {
    try {
      const attachments = await attachmentService.getTaskAttachments(req.params.taskId as string);
      res.json(successResponse(attachments));
    } catch (error) {
      next(error);
    }
  },

  async deleteAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      await attachmentService.deleteAttachment(req.params.id as string);
      res.json(successResponse(null, 'Attachment deleted'));
    } catch (error) {
      next(error);
    }
  },
};
