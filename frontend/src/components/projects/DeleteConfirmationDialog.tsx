import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useDeleteProject } from '../../hooks/useProjects';
import { useNavigate } from 'react-router-dom';

interface Props {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteConfirmationDialog: React.FC<Props> = ({ projectId, projectName, isOpen, onClose }) => {
  const { mutateAsync: deleteProject, isPending } = useDeleteProject();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      await deleteProject(projectId);
      onClose();
      navigate('/projects', { replace: true });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-red-500/30 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Delete Project?</h2>
          <p className="text-gray-400 mb-6">
            Are you sure you want to completely delete <strong className="text-white">{projectName}</strong>? This action cannot be undone and will permanently remove all associated tasks, boards, and data.
          </p>
          
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl text-gray-300 bg-slate-800 hover:bg-slate-700 font-medium transition-colors flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-6 py-2.5 flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all disabled:opacity-50 flex-1"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
