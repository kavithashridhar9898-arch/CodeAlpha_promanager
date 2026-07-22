import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface TaskLabel {
  label: Label;
}

export interface UserSnippet {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  order: number;
  columnId: string;
  assignee?: UserSnippet;
  labels: TaskLabel[];
  _count: { comments: number };
}

export interface BoardColumn {
  id: string;
  name: string;
  order: number;
  boardId: string;
  tasks: Task[];
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  columns: BoardColumn[];
}

export const useBoard = (projectId: string) => {
  return useQuery({
    queryKey: ['board', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/board`);
      return data.data as Board;
    },
    enabled: !!projectId,
  });
};
