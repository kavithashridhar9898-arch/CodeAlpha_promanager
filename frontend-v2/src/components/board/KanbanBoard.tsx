'use client';

import React, { useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent 
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from './TaskCard';
import { useProjectStore } from '@/store/projectStore';
import { useRealtime } from '@/hooks/useRealtime';
import { useEffect, useState as useReactState } from 'react';
import { CreateTaskDialog } from './CreateTaskDialog';

export type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignee?: { id: string; name: string; avatarUrl?: string };
  dueDate?: string;
  createdAt?: string;
};



export function KanbanBoard({ projectId, onTaskClick }: { projectId: string, onTaskClick?: (task: Task) => void }) {
  const { tasks = [], columns = [], setTasks, fetchTasks, moveTask } = useProjectStore();
  const { socket } = useRealtime();
  const [activeId, setActiveId] = useReactState<string | null>(null);
  
  const [creatingInColumn, setCreatingInColumn] = useReactState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId, fetchTasks]);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for realtime task moves from other users
    socket.on('task:moved', (data: { taskId: string, status: string }) => {
      setTasks(useProjectStore.getState().tasks.map(t => 
        t.id === data.taskId ? { ...t, status: data.status as Task['status'] } : t
      ));
    });

    return () => {
      socket.off('task:moved');
    };
  }, [socket, setTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    // Dropping a task over another task
    if (isActiveTask && isOverTask) {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const overIndex = tasks.findIndex((t) => t.id === overId);

      if (tasks[activeIndex].status !== tasks[overIndex].status) {
        const newTasks = [...tasks];
        newTasks[activeIndex].status = tasks[overIndex].status;
        setTasks(arrayMove(newTasks, activeIndex, overIndex));
      } else {
        setTasks(arrayMove(tasks, activeIndex, overIndex));
      }
    }

    // Dropping a task over an empty column
    if (isActiveTask && isOverColumn) {
      setTasks(tasks.map((t) => {
        if (t.id === activeId) {
          const newStatus = overId as Task['status'];
          if (t.status !== newStatus) moveTask(t.id, newStatus);
          return { ...t, status: newStatus };
        }
        return t;
      }));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    setTasks(tasks.map((t) => {
      if (t.id === activeId) {
        const overTask = tasks.find(ot => ot.id === overId);
        if (overTask && t.status !== overTask.status) {
           moveTask(t.id, overTask.status);
           return { ...t, status: overTask.status };
        }
      }
      return t;
    }));
  };

  const activeTask = tasks?.find((t) => t.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 h-full overflow-x-auto pb-4">
        {columns.map((column) => (
          <BoardColumn 
            key={column.id} 
            id={column.id} 
            title={column.name}
            tasks={tasks?.filter((t) => t.status === column.id) || []}
            onTaskClick={onTaskClick}
            onAddTask={() => setCreatingInColumn(column.id)}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{
        duration: 300,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)'
      }}>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>

      <CreateTaskDialog 
        projectId={projectId} 
        columnId={creatingInColumn} 
        isOpen={!!creatingInColumn} 
        onClose={() => setCreatingInColumn(null)} 
      />
    </DndContext>
  );
}
