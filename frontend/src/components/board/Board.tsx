import React, { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { useBoard } from '../../hooks/useBoard';
import { useMoveTask } from '../../hooks/useTasks';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from './TaskCard';
import type { Task, BoardColumn as ColumnType } from '../../hooks/useBoard';
import { Loader2 } from 'lucide-react';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskDetailsDrawer } from './TaskDetailsDrawer';
import { OnlinePresence } from './OnlinePresence';
import { useProjectSocket, type OnlineUser } from '../../hooks/useProjectSocket';
import { useProject } from '../../hooks/useProjects';
import { BoardFilters, type TaskFilters } from './BoardFilters';

interface Props {
  projectId: string;
}

export const Board: React.FC<Props> = ({ projectId }) => {
  const { data: board, isLoading, error } = useBoard(projectId);
  const { data: project } = useProject(projectId);
  const { mutateAsync: moveTask } = useMoveTask(projectId);

  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string | null>(null);
  const [activeTaskDetails, setActiveTaskDetails] = useState<Task | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({});

  // Join socket room and receive live updates
  useProjectSocket(projectId, setOnlineUsers);

  // Sync state with server data
  useEffect(() => {
    if (board) {
      setColumns(board.columns);
    }
  }, [board]);

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  const renderedColumns = useMemo(() => {
    return columns.map(col => {
      let filteredTasks = col.tasks.filter(task => {
        if (filters.priority && task.priority !== filters.priority) return false;
        if (filters.status && task.status !== filters.status) return false;
        if (filters.assigneeId) {
          if (filters.assigneeId === 'unassigned' && task.assigneeId) return false;
          if (filters.assigneeId !== 'unassigned' && task.assigneeId !== filters.assigneeId) return false;
        }
        return true;
      });

      if (filters.sortBy) {
        filteredTasks.sort((a, b) => {
          switch (filters.sortBy) {
            case 'NEWEST': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'OLDEST': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'PRIORITY': 
              const p: any = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
              return p[b.priority] - p[a.priority];
            case 'DUE_DATE':
              if (!a.dueDate) return 1;
              if (!b.dueDate) return -1;
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            case 'RECENTLY_UPDATED': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            default: return a.order - b.order;
          }
        });
      } else {
        filteredTasks.sort((a, b) => a.order - b.order);
      }

      return { ...col, tasks: filteredTasks };
    });
  }, [columns, filters]);

  const hasActiveFilters = Object.keys(filters).some((k) => filters[k as keyof TaskFilters] !== undefined);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !board) {
    return <div className="text-red-400 p-4">Failed to load board.</div>;
  }

  const onDragStart = (event: DragStartEvent) => {
    if (hasActiveFilters) return;
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    if (hasActiveFilters) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      setColumns((columns) => {
        const activeIndex = columns.findIndex((col) => col.tasks.some((t) => t.id === activeId));
        const overIndex = columns.findIndex((col) => col.tasks.some((t) => t.id === overId));

        if (activeIndex === -1 || overIndex === -1) return columns;

        const activeColumn = columns[activeIndex];
        const overColumn = columns[overIndex];

        const activeTaskIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
        const overTaskIndex = overColumn.tasks.findIndex((t) => t.id === overId);

        const newColumns = [...columns];

        if (activeIndex === overIndex) {
          newColumns[activeIndex].tasks = arrayMove(activeColumn.tasks, activeTaskIndex, overTaskIndex);
        } else {
          const [movedTask] = newColumns[activeIndex].tasks.splice(activeTaskIndex, 1);
          movedTask.columnId = overColumn.id;
          newColumns[overIndex].tasks.splice(overTaskIndex, 0, movedTask);
        }

        newColumns.forEach(col => {
          col.tasks.forEach((t, i) => t.order = i);
        });

        return newColumns;
      });
    }

    if (isActiveTask && isOverColumn) {
      setColumns((columns) => {
        const activeIndex = columns.findIndex((col) => col.tasks.some((t) => t.id === activeId));
        const overIndex = columns.findIndex((col) => col.id === overId);

        if (activeIndex === -1 || overIndex === -1) return columns;

        const newColumns = [...columns];
        const activeTaskIndex = newColumns[activeIndex].tasks.findIndex((t) => t.id === activeId);

        const [movedTask] = newColumns[activeIndex].tasks.splice(activeTaskIndex, 1);
        movedTask.columnId = newColumns[overIndex].id;
        newColumns[overIndex].tasks.push(movedTask);

        newColumns.forEach(col => {
          col.tasks.forEach((t, i) => t.order = i);
        });

        return newColumns;
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    if (hasActiveFilters) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    
    let targetColumnId = '';
    let targetOrder = 0;

    columns.forEach(col => {
      const idx = col.tasks.findIndex(t => t.id === activeId);
      if (idx !== -1) {
        targetColumnId = col.id;
        targetOrder = idx;
      }
    });

    if (targetColumnId !== '') {
      try {
        await moveTask({ taskId: activeId, columnId: targetColumnId, order: targetOrder });
      } catch (e) {
        console.error("Failed to move task", e);
      }
    }
  };

  const projectMembers = project?.members.map(m => m.user) || [];

  return (
    <div className="h-full flex flex-col pt-2">
      <div className="flex flex-col mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            {board.name}
          </h2>
          {project && (
            <OnlinePresence onlineUsers={onlineUsers} allMembers={project.members} />
          )}
        </div>
        <BoardFilters filters={filters} setFilters={setFilters} members={projectMembers} />
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full items-start">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <div className="flex gap-6 h-full items-start">
              <SortableContext items={columnIds}>
                {renderedColumns.map((col) => (
                  <BoardColumn
                    key={col.id}
                    column={col}
                    tasks={col.tasks}
                    onTaskClick={(task) => setActiveTaskDetails(task)}
                    onCreateTask={(columnId) => setCreateTaskColumnId(columnId)}
                  />
                ))}
              </SortableContext>
            </div>

            {createPortal(
              <DragOverlay>
                {activeTask ? (
                  <div className="rotate-2 scale-105 opacity-80 cursor-grabbing">
                    <TaskCard task={activeTask} onClick={() => {}} />
                  </div>
                ) : null}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        </div>
      </div>
      <CreateTaskDialog 
        projectId={projectId} 
        columnId={createTaskColumnId} 
        isOpen={!!createTaskColumnId} 
        onClose={() => setCreateTaskColumnId(null)} 
      />
      <TaskDetailsDrawer
        projectId={projectId}
        task={activeTaskDetails}
        isOpen={!!activeTaskDetails}
        onClose={() => setActiveTaskDetails(null)}
      />
    </div>
  );
};
