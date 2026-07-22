import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export interface TeamMember {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  createdAt: string;
  members: TeamMember[];
}

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data } = await api.get('/teams');
      return data.data as Team[];
    },
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: async () => {
      const { data } = await api.get(`/teams/${id}`);
      return data.data as Team;
    },
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await api.post('/teams', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useUpdateTeam(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; description?: string }) => {
      const res = await api.patch(`/teams/${teamId}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useRemoveTeamMember(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/teams/${teamId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useDeleteTeam(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/teams/${teamId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useAddTeamMember(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post(`/teams/${teamId}/members`, { email });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useUpdateTeamMemberRole(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const res = await api.patch(`/teams/${teamId}/members/${memberId}/role`, { role });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}
