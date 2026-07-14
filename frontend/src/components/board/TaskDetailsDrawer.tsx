import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { CommentSection } from './CommentSection';
import { useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import type { Task } from '../../hooks/useBoard';
import { useProject } from '../../hooks/useProjects';

const schema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  projectId: string;
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailsDrawer: React.FC<Props> = ({ projectId, task, isOpen, onClose }) => {
  const { data: project } = useProject(projectId);
  const { mutateAsync: updateTask } = useUpdateTask(projectId);
  const { mutateAsync: deleteTask, isPending: isDeleting } = useDeleteTask(projectId);

  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'TODO',
      priority: task?.priority || 'MEDIUM',
      assigneeId: task?.assignee?.id || null,
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : null,
    },
  });

  if (!isOpen || !task) return null;

  const onSubmit = async (data: FormValues) => {
    try {
      await updateTask({ 
        id: task.id, 
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
      onClose();
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-[100] flex animate-in slide-in-from-right sm:max-w-md w-full bg-slate-900 border-l border-slate-700 shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out`}>
      <div className="flex flex-col h-full w-full relative">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Task Details
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {!isEditing ? (
            <>
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-2xl font-bold text-white leading-tight">{task.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                    task.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-400' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                    task.status === 'IN_REVIEW' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 ${
                    task.priority === 'URGENT' ? 'bg-red-500/20 text-red-400' :
                    task.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                    task.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    <AlertCircle className="w-3 h-3" />
                    {task.priority}
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Assignee</span>
                  <div className="flex items-center gap-2">
                    {task.assignee ? (
                      <>
                        <span className="text-sm font-semibold text-white">{task.assignee.name}</span>
                        {task.assignee.avatarUrl ? (
                          <img src={task.assignee.avatarUrl} alt={task.assignee.name} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                            {task.assignee.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-500 italic">Unassigned</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Due Date</span>
                  <div className="flex items-center gap-2 text-white">
                    {task.dueDate ? (
                      <>
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm">{new Date(task.dueDate).toLocaleDateString()}</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500 italic">No date</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                {task.description ? (
                  <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm italic">No description provided.</p>
                )}
              </div>

              {/* ── Comments ─────────────────────────────────────────── */}
              <div className="border-t border-slate-800 pt-6">
                <CommentSection taskId={task.id} />
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Task Title *</label>
                <input
                  {...register('title')}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white outline-none transition-all"
                  autoFocus
                />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Description</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Status</label>
                  <select
                    {...register('status')}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Priority</label>
                  <select
                    {...register('priority')}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Assignee</label>
                <select
                  {...register('assigneeId')}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                >
                  <option value="">Unassigned</option>
                  {project?.members.map(m => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Due Date</label>
                <input
                  type="datetime-local"
                  {...register('dueDate')}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-gray-300 hover:bg-slate-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 flex items-center justify-center min-w-[120px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 sticky bottom-0 z-10 flex justify-between items-center gap-4">
          {!isEditing ? (
            <>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center justify-center p-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                title="Delete Task"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="flex-1 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-lg shadow-indigo-500/25 text-center"
              >
                Edit Task
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
