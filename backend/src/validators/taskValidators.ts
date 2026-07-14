import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    columnId: z.string().min(1, 'Column ID is required'),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    columnId: z.string().optional(),
  }),
});

export const moveTaskSchema = z.object({
  body: z.object({
    columnId: z.string().min(1, 'Column ID is required'),
    order: z.number().min(0, 'Order must be a positive number'),
  }),
});

export const assignTaskSchema = z.object({
  body: z.object({
    assigneeId: z.string().nullable(),
  }),
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  }),
});

export const updateTaskPrioritySchema = z.object({
  body: z.object({
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  }),
});

export const updateTaskDueDateSchema = z.object({
  body: z.object({
    dueDate: z.string().datetime().nullable(),
  }),
});
