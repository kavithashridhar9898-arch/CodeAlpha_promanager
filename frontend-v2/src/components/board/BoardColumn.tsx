'use client';

import React, { useMemo } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from './KanbanBoard';
import { TaskCard } from './TaskCard';

interface BoardColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
}

export function BoardColumn({ id, title, tasks, onTaskClick, onAddTask }: BoardColumnProps) {
  const { setNodeRef } = useSortable({
    id: id,
    data: {
      type: 'Column',
      id
    }
  });

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className="flex flex-col flex-shrink-0 w-80 bg-secondary/30 rounded-2xl border border-border p-4 h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-semibold text-foreground capitalize flex items-center gap-2">
          {title}
          <span className="text-xs bg-secondary/80 text-muted-foreground px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </h3>
        <button 
          onClick={onAddTask}
          className="text-muted-foreground hover:text-foreground p-1 transition-colors hover:bg-white/5 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </button>
      </div>

      <div 
        ref={setNodeRef}
        className="flex flex-col gap-3 flex-1 overflow-y-auto"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <div key={task.id} onClick={() => onTaskClick?.(task)}>
              <TaskCard task={task} />
            </div>
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
