import { Request, Response, NextFunction } from 'express';
import { boardService } from '../services/boardService';
import { successResponse } from '../utils/response';
import { param } from '../utils/param';

export const boardController = {
  async getByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const board = await boardService.getByProject(param(req, 'projectId'), req.user!.id);
      res.json(successResponse(board, 'Board fetched successfully'));
    } catch (error) {
      next(error);
    }
  },
};
