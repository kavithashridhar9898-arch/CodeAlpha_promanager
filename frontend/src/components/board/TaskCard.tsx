import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import type { Task } from '../../hooks/useBoard';

interface Props {
  task: Task;
  onClick: () => void;
}

export const TaskCard: React.FC<Props> = ({ task, onClick }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 border-2 border-indigo-500 border-dashed rounded-xl h-[120px] bg-slate-800/50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-slate-800 border border-slate-700/50 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-indigo-500/50 hover:bg-slate-750 transition-colors group shadow-sm hover:shadow-indigo-500/10"
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <h4 className="text-sm font-semibold text-white leading-tight line-clamp-2">
          {task.title}
        </h4>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {task.labels?.map(({ label }) => (
          <span
            key={label.id}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${label.color}20`, color: label.color, border: `1px solid ${label.color}30` }}
          >
            {label.name}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
          {task.dueDate && (
            <div className={`flex items-center gap-1.5 ${new Date(task.dueDate) < new Date() ? 'text-red-400' : ''}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
          
          {task._count?.comments > 0 && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{task._count.comments}</span>
            </div>
          )}

          {task.priority && task.priority !== 'MEDIUM' && (
             <div className="flex items-center gap-1">
               <AlertCircle className={`w-3.5 h-3.5 ${
                 task.priority === 'URGENT' ? 'text-red-400' : 
                 task.priority === 'HIGH' ? 'text-amber-400' : 
                 'text-slate-400'
               }`} />
             </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div className="relative group/avatar">
              {task.assignee.avatarUrl ? (
                <img src={task.assignee.avatarUrl} alt={task.assignee.name} className="w-6 h-6 rounded-full ring-2 ring-slate-800" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-slate-800">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border border-dashed border-slate-600 flex items-center justify-center text-slate-600">
              <span className="sr-only">Unassigned</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
