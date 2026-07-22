import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  taskId: string;
  createdAt: string;
}

export function useAttachments(taskId: string) {
  return useQuery({
    queryKey: ['attachments', taskId],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${taskId}/attachments`);
      return data.data as Attachment[];
    },
    enabled: !!taskId,
  });
}

export function useUploadAttachment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', taskId] });
    },
  });
}

export function useDeleteAttachment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', taskId] });
    },
  });
}
