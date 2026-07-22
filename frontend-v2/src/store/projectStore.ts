import { create } from 'zustand';
import { api } from '@/lib/axios';
import { Task } from '@/components/board/KanbanBoard';

interface ProjectState {
  tasks: Task[];
  columns: { id: string, name: string }[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: (projectId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  tasks: [],
  columns: [],
  isLoading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),

  fetchTasks: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/projects/${projectId}/board`);
      const board = response.data.data;
      const columns = board.columns.map((col: any) => ({ id: col.id, name: col.name }));
      
      // Extract tasks from all columns and ensure they match our Task interface
      const allTasks = board.columns.flatMap((col: any) => 
        col.tasks.map((t: any) => ({
          ...t,
          status: col.id // Use column id as status string for KanbanBoard to use
        }))
      );
      set({ tasks: allTasks, columns, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  moveTask: async (taskId, newStatus) => {
    // Optimistic update handled in the component
    try {
      await api.patch(`/tasks/${taskId}/move`, { columnId: newStatus, order: 0 });
    } catch (error: any) {
      console.error('Failed to move task on server:', error);
      // We might want to revert the optimistic update here if it fails
    }
  }
}));
