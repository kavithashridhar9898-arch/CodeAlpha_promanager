import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(5000),
    parentCommentId: z.string().optional().nullable(),
    mentionedUserIds: z.array(z.string()).optional(),
  }),
});

export const updateCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(5000),
    mentionedUserIds: z.array(z.string()).optional(),
  }),
});
