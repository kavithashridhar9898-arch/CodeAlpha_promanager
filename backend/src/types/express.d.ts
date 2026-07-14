// src/types/express.d.ts
// Augments the Express Request type to include `user` after JWT auth middleware.

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

export {};
