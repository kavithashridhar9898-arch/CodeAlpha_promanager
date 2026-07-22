'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from './KanbanBoard';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, AlignLeft } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

const PriorityIndicator = ({ priority }: { priority: Task['priority'] }) => {
  const colors = {
    LOW: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20',
    MEDIUM: 'bg-amber-500/20 text-amber-500 border-amber-500/20',
    HIGH: 'bg-rose-500/20 text-rose-500 border-rose-500/20',
  };

  return (
    <div className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 border ${colors[priority]} font-medium`}>
      <AlertCircle className="w-3 h-3" />
      {priority}
    </div>
  );
};

export function TaskCard({ task, isOverlay }: TaskCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task
    }
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging && !isOverlay) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="h-32 bg-secondary/10 border-2 border-dashed border-border rounded-xl opacity-50" 
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-card p-4 rounded-xl border border-border shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors ${
        isOverlay ? 'scale-105 shadow-xl rotate-2 ring-2 ring-primary cursor-grabbing' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <PriorityIndicator priority={task.priority} />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="text-xs">2d</span>
        </div>
      </div>
      
      <h4 className="font-medium text-foreground mb-1">{task.title}</h4>
      
      {task.description && (
        <div className="flex items-center gap-1.5 text-muted-foreground mt-2">
          <AlignLeft className="w-4 h-4" />
          <p className="text-xs truncate">{task.description}</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary border border-background">U1</div>
          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-500 border border-background">U2</div>
        </div>
        
        <div className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
          {task.id.padStart(4, 'T-')}
        </div>
      </div>
    </div>
  );
}
