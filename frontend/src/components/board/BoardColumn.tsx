import React, { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { BoardColumn as ColumnType, Task } from '../../hooks/useBoard';

interface Props {
  column: ColumnType;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCreateTask: (columnId: string) => void;
}

export const BoardColumn: React.FC<Props> = ({ column, tasks, onTaskClick, onCreateTask }) => {
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div className="flex flex-col bg-slate-900/50 rounded-2xl w-[320px] shrink-0 max-h-full border border-slate-800/50">
      <div className="p-4 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">{column.name}</h3>
          <span className="flex items-center justify-center bg-slate-800 text-slate-300 text-xs font-semibold w-6 h-6 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onCreateTask(column.id)}
          className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
          title="Add Task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto min-h-[150px] space-y-3 flex flex-col" ref={setNodeRef}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
