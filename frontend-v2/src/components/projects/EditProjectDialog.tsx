'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUpdateProject } from '@/hooks/useProjects';
import type { Project } from '@/hooks/useProjects';

const schema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function EditProjectDialog({ project, isOpen, onClose }: Props) {
  const { mutateAsync: updateProject } = useUpdateProject();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
      status: project.status as any,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await updateProject({ id: project.id, ...data });
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-secondary/30">
              <h2 className="text-xl font-bold text-foreground">Edit Project</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-muted-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Project Name</label>
                <input
                  {...register('name')}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground outline-none transition-all placeholder:text-muted-foreground/50"
                  placeholder="e.g. Q3 Marketing Campaign"
                  autoFocus
                />
                {errors.name && <p className="text-destructive text-xs font-medium">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground outline-none transition-all resize-none placeholder:text-muted-foreground/50"
                  placeholder="Briefly describe the project..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Status</label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground outline-none transition-all appearance-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
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
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
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
