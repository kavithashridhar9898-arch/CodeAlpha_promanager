import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/teamService';
import { successResponse } from '../utils/response';

export const teamController = {
  async createTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const team = await teamService.createTeam(req.user!.id, req.body);
      res.status(201).json(successResponse(team, 'Team created successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getUserTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const teams = await teamService.getUserTeams(req.user!.id);
      res.json(successResponse(teams));
    } catch (error) {
      next(error);
    }
  },

  async getTeamById(req: Request, res: Response, next: NextFunction) {
    try {
      const team = await teamService.getTeamById(req.params.id as string, req.user!.id);
      res.json(successResponse(team));
    } catch (error) {
      next(error);
    }
  },

  async updateTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const team = await teamService.updateTeam(req.params.id as string, req.user!.id, req.body);
      res.json(successResponse(team, 'Team updated successfully'));
    } catch (error) {
      next(error);
    }
  },

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      await teamService.removeMember(req.params.id as string, req.params.memberId as string, req.user!.id);
      res.json(successResponse(null, 'Member removed successfully'));
    } catch (error) {
      next(error);
    }
  },

  async deleteTeam(req: Request, res: Response, next: NextFunction) {
    try {
      await teamService.deleteTeam(req.params.id as string, req.user!.id);
      res.json(successResponse(null, 'Team deleted successfully'));
    } catch (error) {
      next(error);
    }
  },

  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ status: 'error', message: 'Email is required' });
        return;
      }
      const member = await teamService.addMember(req.params.id as string, email, req.user!.id);
      res.status(201).json(successResponse(member, 'Member added successfully'));
    } catch (error) {
      next(error);
    }
  },

  async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role } = req.body;
      if (!role) {
        res.status(400).json({ status: 'error', message: 'Role is required' });
        return;
      }
      const member = await teamService.updateMemberRole(
        req.params.id as string,
        req.params.memberId as string,
        role,
        req.user!.id
      );
      res.json(successResponse(member, 'Member role updated successfully'));
    } catch (error) {
      next(error);
    }
  },
};
