import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/projectService';
import { successResponse } from '../utils/response';
import { param } from '../utils/param';

export const projectController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await projectService.getAll(req.user!.id);
      res.json(successResponse(projects, 'Projects fetched'));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.getById(param(req, 'id'), req.user!.id);
      res.json(successResponse(project, 'Project fetched'));
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body as { name: string; description?: string };
      const project = await projectService.create({ name, description, ownerId: req.user!.id });
      res.status(201).json(successResponse(project, 'Project created'));
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.update(param(req, 'id'), req.user!.id, req.body);
      res.json(successResponse(project, 'Project updated'));
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await projectService.delete(param(req, 'id'), req.user!.id);
      res.json(successResponse(null, 'Project deleted'));
    } catch (error) {
      next(error);
    }
  },

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.archive(param(req, 'id'), req.user!.id);
      res.json(successResponse(project, 'Project archived'));
    } catch (error) {
      next(error);
    }
  },

  async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, role } = req.body as { email: string; role?: 'ADMIN' | 'MEMBER' };
      const member = await projectService.addMember(param(req, 'id'), req.user!.id, email, role);
      res.status(201).json(successResponse(member, 'Member added'));
    } catch (error) {
      next(error);
    }
  },

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      await projectService.removeMember(param(req, 'id'), req.user!.id, param(req, 'memberId'));
      res.json(successResponse(null, 'Member removed'));
    } catch (error) {
      next(error);
    }
  },
};
