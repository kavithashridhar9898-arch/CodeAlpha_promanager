import { Request, Response, NextFunction } from 'express';
import mcache from 'memory-cache';
import { logger } from '../utils/logger';

export const cache = (durationMinutes: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = '__express__' + (req.user?.id || 'public') + '_' + req.originalUrl || req.url;
    const cachedBody = mcache.get(key);
    
    if (cachedBody) {
      logger.debug(`Cache hit for ${key}`);
      res.send(cachedBody);
      return;
    } else {
      logger.debug(`Cache miss for ${key}`);
      const sendResponse = res.send.bind(res);
      res.send = (body: any) => {
        mcache.put(key, body, durationMinutes * 60 * 1000);
        return sendResponse(body);
      };
      next();
    }
  };
};
