import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export interface ChecklistItem {
  id: string;
  content: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface Checklist {
  id: string;
  title: string;
  taskId: string;
  items: ChecklistItem[];
}

export function useChecklists(taskId: string) {
  return useQuery({
    queryKey: ['checklists', taskId],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${taskId}/checklists`);
      return data.data as Checklist[];
    },
    enabled: !!taskId,
  });
}

export function useCreateChecklist(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const { data } = await api.post(`/tasks/${taskId}/checklists`, { title });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', taskId] });
    },
  });
}

export function useDeleteChecklist(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (checklistId: string) => {
      await api.delete(`/tasks/${taskId}/checklists/${checklistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', taskId] });
    },
  });
}

export function useAddChecklistItem(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ checklistId, content }: { checklistId: string; content: string }) => {
      const { data } = await api.post(`/tasks/${taskId}/checklists/${checklistId}/items`, { content });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', taskId] });
    },
  });
}

export function useUpdateChecklistItem(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ checklistId, itemId, isCompleted, content }: { checklistId: string; itemId: string; isCompleted?: boolean; content?: string }) => {
      const { data } = await api.patch(`/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`, { isCompleted, content });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', taskId] });
    },
  });
}

export function useDeleteChecklistItem(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ checklistId, itemId }: { checklistId: string; itemId: string }) => {
      await api.delete(`/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', taskId] });
    },
  });
}
