import { Request } from 'express';

/**
 * Express v5 types `req.params[key]` as `string | string[]`.
 * This helper safely extracts it as a plain string.
 */
export function param(req: Request, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}
