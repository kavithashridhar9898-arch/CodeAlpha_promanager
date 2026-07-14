import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required').max(100),
    description: z.string().optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required').max(100).optional(),
    description: z.string().optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
  }),
});

export const archiveProjectSchema = z.object({
  body: z.object({
    status: z.literal('ARCHIVED'),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
  }),
});
