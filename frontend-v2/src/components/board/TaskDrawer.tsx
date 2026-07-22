'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlignLeft, Send, Pencil, Check, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { Task } from './KanbanBoard';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useProject } from '@/hooks/useProjects';
import { CommentSection } from './CommentSection';

const schema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface TaskDrawerProps {
  projectId: string;
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDrawer({ projectId, task, isOpen, onClose }: TaskDrawerProps) {
  const { data: project } = useProject(projectId);
  const { mutateAsync: updateTask } = useUpdateTask(projectId);
  const { mutateAsync: deleteTask, isPending: isDeleting } = useDeleteTask(projectId);

  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      title: task?.title || '',
      description: task?.description || '',
      status: (task?.status as any) || 'TODO',
      priority: (task?.priority as any) || 'MEDIUM',
      assigneeId: task?.assignee?.id || null,
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : null,
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!task) return;
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
    if (!task) return;
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && task && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground bg-background border border-border px-2.5 py-1 rounded-md shadow-sm">
                  {task.id.substring(0, 8).toUpperCase()}
                </span>
                {!isEditing && (
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border ${
                    task.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    task.status === 'REVIEW' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    'bg-secondary text-muted-foreground border-border'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 flex items-center gap-2 rounded-xl bg-background border border-border hover:bg-secondary/50 text-foreground text-xs font-semibold transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary/80 text-muted-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {!isEditing ? (
                <>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4 leading-tight">{task.title}</h2>
                    <div className="flex items-center gap-4 mt-4">
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 border ${
                        task.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        task.priority === 'MEDIUM' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-secondary text-muted-foreground border-border'
                      }`}>
                        <AlertCircle className="w-3 h-3" />
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-lg border border-border">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Created {new Date(task.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-secondary/20 border border-border">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Assignee</span>
                      <div className="flex items-center gap-2 mt-1">
                        {task.assignee ? (
                          <>
                            {task.assignee.avatarUrl ? (
                              <img src={task.assignee.avatarUrl} alt={task.assignee.name} className="w-6 h-6 rounded-full border border-border" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                                {task.assignee.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-semibold text-foreground">{task.assignee.name}</span>
                          </>
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground italic">Unassigned</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Due Date</span>
                      <div className="flex items-center gap-2 mt-1 text-foreground">
                        {task.dueDate ? (
                          <>
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">{new Date(task.dueDate).toLocaleDateString()}</span>
                          </>
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground italic">No date set</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2 mb-3">
                      <AlignLeft className="w-4 h-4" /> Description
                    </h3>
                    <div className="bg-background rounded-2xl p-5 border border-border shadow-sm text-sm leading-relaxed text-muted-foreground/90 whitespace-pre-wrap">
                      {task.description || <span className="italic opacity-50">No description provided.</span>}
                    </div>
                  </div>

                  <div>
                    <CommentSection taskId={task.id} />
                  </div>
                </>
              ) : (
                <form id="edit-task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Task Title</label>
                    <input
                      {...register('title')}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground outline-none transition-all placeholder:text-muted-foreground/50"
                      autoFocus
                    />
                    {errors.title && <p className="text-destructive text-xs font-medium">{errors.title.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                    <textarea
                      {...register('description')}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground outline-none transition-all resize-none placeholder:text-muted-foreground/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                      <select
                        {...register('status')}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
                      <select
                        {...register('priority')}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assignee</label>
                      <select
                        {...register('assigneeId')}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Unassigned</option>
                        {project?.members.map(m => (
                          <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Due Date</label>
                      <input
                        type="datetime-local"
                        {...register('dueDate')}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            {isEditing && (
              <div className="p-5 border-t border-border bg-secondary/10 flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 font-medium transition-colors text-sm"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Task'}
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { reset(); setIsEditing(false); }}
                    className="px-5 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary font-semibold transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="edit-task-form"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 flex items-center justify-center min-w-[120px] rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-sm shadow-lg shadow-primary/25"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
