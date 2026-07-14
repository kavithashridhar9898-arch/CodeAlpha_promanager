/**
 * AppError — operational errors that are safe to expose to the client.
 * Non-operational errors (bugs, unexpected failures) should bubble up
 * to the global error handler as plain Error instances.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
