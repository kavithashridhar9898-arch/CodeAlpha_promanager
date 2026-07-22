import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import type { Task } from './useBoard';

export const useCreateTask = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; description?: string; columnId: string; status?: string; priority?: string; dueDate?: string | null; assigneeId?: string | null }) => {
      const { data } = await api.post('/tasks', payload);
      return data.data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });
};

export const useUpdateTask = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; title?: string; description?: string; status?: string; priority?: string; dueDate?: string | null; assigneeId?: string | null }) => {
      const { data } = await api.put(`/tasks/${id}`, payload);
      return data.data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });
};

export const useMoveTask = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, columnId, order }: { taskId: string; columnId: string; order: number }) => {
      const { data } = await api.patch(`/tasks/${taskId}/move`, { columnId, order });
      return data.data as Task;
    },
    // Optimistic updates are usually handled in the component before calling this.
    // We just invalidate to ensure sync if optimistic update fails or to finalize.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });
};

export const useDeleteTask = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });
};
