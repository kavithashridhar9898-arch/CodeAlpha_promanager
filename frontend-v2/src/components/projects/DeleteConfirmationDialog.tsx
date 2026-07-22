'use client';

import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useDeleteProject } from '@/hooks/useProjects';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteConfirmationDialog({ projectId, projectName, isOpen, onClose }: Props) {
  const { mutateAsync: deleteProject, isPending } = useDeleteProject();
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteProject(projectId);
      onClose();
      router.push('/dashboard/projects');
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
            className="relative w-full max-w-md bg-card border border-destructive/30 shadow-2xl rounded-3xl overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-5">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Delete Project?</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Are you sure you want to completely delete <strong className="text-foreground">{projectName}</strong>? This action cannot be undone and will permanently remove all associated tasks, boards, and data.
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="px-6 py-3 rounded-xl text-muted-foreground bg-secondary hover:bg-secondary/80 font-semibold transition-colors flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-6 py-3 flex items-center justify-center rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex-1 shadow-lg shadow-destructive/25"
                >
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
