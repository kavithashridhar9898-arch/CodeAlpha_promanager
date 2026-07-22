import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export interface Invitation {
  id: string;
  email: string;
  projectId: string;
  inviterId: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  token: string;
  expiresAt: string;
  createdAt: string;
  inviter: {
    id: string;
    name: string;
    email: string;
  };
  project: {
    id: string;
    name: string;
  };
}

export function useMyInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const { data } = await api.get('/invitations');
      return data.data as Invitation[];
    },
  });
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, accept }: { token: string; accept: boolean }) => {
      const action = accept ? 'accept' : 'decline';
      await api.post(`/invitations/${token}/${action}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
