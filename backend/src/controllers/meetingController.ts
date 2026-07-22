import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { nanoid } from 'nanoid';

export const createMeeting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hostId = req.user!.id;
    const { title, description, startTime, teamId, projectId, isInstant } = req.body;

    if (!title) throw new AppError('Meeting title is required', 400);

    const joinId = nanoid(12);
    const joinLink = `https://meet.jit.si/promanager-${joinId}`;

    const start = isInstant ? new Date() : new Date(startTime);

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        hostId,
        joinLink,
        startTime: start,
        teamId,
        projectId,
        isInstant: !!isInstant,
        isActive: !!isInstant,
        participants: {
          create: [{ userId: hostId }],
        },
      },
      include: { participants: true },
    });

    res.status(201).json({ success: true, data: meeting });
  } catch (err) { next(err); }
};

export const getMeetings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const meetings = await prisma.meeting.findMany({
      where: {
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
        ],
      },
      include: { participants: { select: { userId: true, joinedAt: true } } },
      orderBy: { startTime: 'asc' },
    });

    res.json({ success: true, data: meetings });
  } catch (err) { next(err); }
};

export const joinMeeting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const meetingId = req.params.meetingId as string;

    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new AppError('Meeting not found', 404);

    // Upsert participant
    await prisma.meetingParticipant.upsert({
      where: { meetingId_userId: { meetingId, userId } },
      update: { joinedAt: new Date(), leftAt: null },
      create: { meetingId, userId },
    });

    // Activate meeting if not already
    if (!meeting.isActive) {
      await prisma.meeting.update({ where: { id: meetingId }, data: { isActive: true } });
    }

    res.json({ success: true, data: { joinLink: meeting.joinLink } });
  } catch (err) { next(err); }
};

export const cancelMeeting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const meetingId = req.params.meetingId as string;

    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new AppError('Meeting not found', 404);
    if (meeting.hostId !== userId) throw new AppError('Only the host can cancel a meeting', 403);

    await prisma.meeting.delete({ where: { id: meetingId } });
    res.json({ success: true, message: 'Meeting cancelled' });
  } catch (err) { next(err); }
};
