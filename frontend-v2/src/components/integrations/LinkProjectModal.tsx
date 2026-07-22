import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Loader2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { api } from '@/lib/axios';

interface LinkProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: any;
  onLinked: () => void;
}

export function LinkProjectModal({ isOpen, onClose, repo, onLinked }: LinkProjectModalProps) {
  const { data: projects, isLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLink = async () => {
    if (!selectedProjectId) return;
    setIsLinking(true);
    setError(null);
    try {
      await api.post('/integrations/github/link-repo', {
        projectId: selectedProjectId,
        providerId: repo.providerId,
        fullName: repo.fullName,
        name: repo.name,
        url: repo.url,
        defaultBranch: repo.defaultBranch,
        stars: repo.stars,
        forks: repo.forks,
      });
      onLinked();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to link repository');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden"
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Link Repository
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Select a project to link <span className="font-semibold text-foreground">{repo?.name}</span>. This will enable repository sync and task linking.
            </p>

            {error && (
              <div className="p-3 mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select Project</label>
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading projects...
                </div>
              ) : projects?.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 bg-secondary rounded-lg">No projects found. Create one first!</p>
              ) : (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                >
                  <option value="" disabled>Choose a project...</option>
                  {projects?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="p-6 bg-secondary/30 flex justify-end gap-3 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 hover:bg-secondary rounded-xl text-sm font-medium transition-colors"
              disabled={isLinking}
            >
              Cancel
            </button>
            <button
              onClick={handleLink}
              disabled={!selectedProjectId || isLinking}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Link Project
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
