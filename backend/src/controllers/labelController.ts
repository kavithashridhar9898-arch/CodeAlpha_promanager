import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/AppError';

export const labelController = {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const labels = await prisma.label.findMany({ orderBy: { createdAt: 'desc' } });
      res.json(successResponse(labels));
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, color } = req.body;
      if (!name?.trim()) throw new AppError('Label name is required', 400);
      const label = await prisma.label.create({ data: { name: name.trim(), color: color || '#6366f1' } });
      res.status(201).json(successResponse(label, 'Label created'));
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, color } = req.body;
      const label = await prisma.label.update({
        where: { id: req.params.id as string },
        data: { ...(name && { name: name.trim() }), ...(color && { color }) },
      });
      res.json(successResponse(label, 'Label updated'));
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.label.delete({ where: { id: req.params.id as string } });
      res.json(successResponse(null, 'Label deleted'));
    } catch (error) {
      next(error);
    }
  },
};
