import { Request, Response } from 'express';
import { TimeService } from '../services/time/TimeService';
import { TimerService } from '../services/time/TimerService';
import { TimesheetService } from '../services/time/TimesheetService';
import { ReportingService } from '../services/time/ReportingService';

export const startTimer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId, taskId, description } = req.body;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const timer = await TimerService.startTimer(userId, projectId, taskId, description);
    res.status(201).json(timer);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error starting timer', error });
  }
};

export const stopTimer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const timer = await TimerService.stopTimer(userId);
    res.json(timer);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error stopping timer', error });
  }
};

export const getActiveTimer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const timer = await TimerService.getActiveTimer(userId);
    res.json(timer);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching active timer', error });
  }
};

export const logTime = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { projectId, taskId, startTime, endTime, description, isBillable } = req.body;
    const entry = await TimeService.logTime({
      userId,
      projectId,
      taskId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      description,
      isBillable
    });
    res.status(201).json(entry);
  } catch (error: any) {
    res.status(500).json({ message: 'Error logging time', error });
  }
};

export const getProjectTimeReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const report = await ReportingService.getProjectTimeReport(projectId as string);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching report', error });
  }
};

export const getUserTimesheet = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate } = req.query;
    if (!userId || !startDate || !endDate) {
      res.status(400).json({ message: 'Missing parameters' });
      return;
    }

    const timesheet = await TimesheetService.getUserTimesheet(
      userId, 
      new Date(startDate as string), 
      new Date(endDate as string)
    );
    res.json(timesheet);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching timesheet', error });
  }
};
