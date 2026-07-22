import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

export interface SearchResults {
  projects: Array<{ id: string; name: string; description: string | null }>;
  tasks: Array<{
    id: string;
    title: string;
    column: { board: { projectId: string; project: { name: string } } };
  }>;
  users: Array<{ id: string; name: string; email: string; avatarUrl: string | null }>;
  comments: Array<{
    id: string;
    content: string;
    task: { id: string; title: string; column: { board: { projectId: string } } };
  }>;
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const { data } = await api.get<{ data: SearchResults }>(`/search?q=${encodeURIComponent(query)}`);
      return data.data;
    },
    enabled: query.trim().length > 0,
    staleTime: 1000 * 60, // Cache for 1 minute
  });
}
