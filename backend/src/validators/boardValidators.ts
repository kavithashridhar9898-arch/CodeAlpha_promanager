import { z } from 'zod';

export const getBoardSchema = z.object({
  params: z.object({
    projectId: z.string(),
  }),
});
