import { Request, Response, NextFunction } from 'express';
import { invitationService } from '../services/invitationService';
import { successResponse } from '../utils/response';

export const invitationController = {
  async inviteToProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, role } = req.body;
      const invitation = await invitationService.inviteToProject(req.params.id as string, req.user!.id, email, role || 'MEMBER');
      res.status(201).json(successResponse(invitation, 'Invitation sent successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getProjectInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      const invitations = await invitationService.getProjectInvitations(req.params.id as string);
      res.json(successResponse(invitations));
    } catch (error) {
      next(error);
    }
  },

  async getMyInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      const invitations = await invitationService.getMyInvitations(req.user!.id);
      res.json(successResponse(invitations));
    } catch (error) {
      next(error);
    }
  },

  async acceptInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      await invitationService.acceptInvitation(req.params.token as string, req.user!.id);
      res.json(successResponse(null, 'Invitation accepted'));
    } catch (error) {
      next(error);
    }
  },

  async declineInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      await invitationService.declineInvitation(req.params.token as string);
      res.json(successResponse(null, 'Invitation declined'));
    } catch (error) {
      next(error);
    }
  },
};
