import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

export interface ActivityLog {
  id: string;
  projectId: string;
  taskId: string | null;
  userId: string;
  action: string;
  description: string;
  metadata: any;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  task: {
    id: string;
    title: string;
  } | null;
  project: {
    id: string;
    name: string;
  };
}

export function useProjectActivity(projectId: string | undefined, filters?: { userId?: string; taskId?: string }) {
  return useQuery({
    queryKey: ['activities', projectId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.taskId) params.append('taskId', filters.taskId);

      const { data } = await api.get<{ data: ActivityLog[] }>(`/projects/${projectId}/activity?${params.toString()}`);
      return data.data;
    },
    enabled: !!projectId,
  });
}
