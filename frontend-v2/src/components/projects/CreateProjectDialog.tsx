'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateProject } from '@/hooks/useProjects';

const schema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectDialog({ isOpen, onClose }: Props) {
  const { mutateAsync: createProject } = useCreateProject();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createProject(data);
      reset();
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
              <h2 className="text-xl font-bold text-foreground">Create New Project</h2>
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
                  placeholder="e.g. Website Redesign"
                  autoFocus
                />
                {errors.name && <p className="text-destructive text-xs font-medium">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Description (Optional)</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground outline-none transition-all resize-none placeholder:text-muted-foreground/50"
                  placeholder="What is this project about?"
                />
                {errors.description && <p className="text-destructive text-xs font-medium">{errors.description.message}</p>}
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
                  className="px-5 py-2.5 flex items-center justify-center min-w-[140px] rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/25"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Project
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
