import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  replies: Comment[];
}

// ── Query key factory ──────────────────────────────────────────────────────────
const commentKeys = {
  byTask: (taskId: string) => ['comments', taskId] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────────

export const useComments = (taskId: string) =>
  useQuery({
    queryKey: commentKeys.byTask(taskId),
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${taskId}/comments`);
      return data.data as Comment[];
    },
    enabled: !!taskId,
    staleTime: 10_000, // 10 s
  });

export const useCreateComment = (taskId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { content: string; parentCommentId?: string | null }) => {
      const { data } = await api.post(`/tasks/${taskId}/comments`, payload);
      return data.data as Comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
    },
  });
};

export const useUpdateComment = (taskId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data } = await api.put(`/comments/${id}`, { content });
      return data.data as Comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
    },
  });
};

export const useDeleteComment = (taskId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
    },
  });
};
