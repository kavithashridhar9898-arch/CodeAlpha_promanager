import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isDev = process.env.NODE_ENV === 'development';

  // Operational, trusted errors — send message to client
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(isDev && { stack: err.stack }),
    });
    return;
  }

  // Prisma known errors
  if (err.constructor?.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as Error & { code?: string; meta?: { target?: string[] } };

    if (prismaErr.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: `A record with this ${prismaErr.meta?.target?.join(', ')} already exists.`,
      });
      return;
    }

    if (prismaErr.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Record not found.' });
      return;
    }
  }

  // Unknown / programming errors — don't leak details in production
  if (isDev) {
    console.error('💥 Unhandled Error:', err);
  }

  res.status(500).json({
    success: false,
    message: isDev ? err.message : 'Something went wrong. Please try again later.',
    ...(isDev && { stack: err.stack }),
  });
}
