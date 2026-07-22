'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateTask } from '@/hooks/useTasks';

const schema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  projectId: string;
  columnId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskDialog({ projectId, columnId, isOpen, onClose }: Props) {
  const { mutateAsync: createTask } = useCreateTask(projectId);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM' }
  });

  const onSubmit = async (data: FormValues) => {
    if (!columnId) return;
    try {
      await createTask({ ...data, columnId });
      reset();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-secondary/30">
              <div>
                <h2 className="text-xl font-bold text-foreground">Create New Task</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Adding to {columnId?.replace('_', ' ')}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-muted-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Task Title</label>
                <input
                  {...register('title')}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground outline-none transition-all placeholder:text-muted-foreground/50"
                  placeholder="What needs to be done?"
                  autoFocus
                />
                {errors.title && <p className="text-destructive text-xs font-medium">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Description</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground outline-none transition-all resize-none placeholder:text-muted-foreground/50"
                  placeholder="Add details, criteria, etc."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Priority</label>
                <select
                  {...register('priority')}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground outline-none transition-all"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 flex items-center justify-center min-w-[140px] rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/25"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
