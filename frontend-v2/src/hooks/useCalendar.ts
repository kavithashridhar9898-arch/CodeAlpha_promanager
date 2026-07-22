import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Task } from './useBoard';

export interface CalendarTask extends Task {
  projectId: string;
  projectName: string;
}

export function useCalendarTasks() {
  return useQuery({
    queryKey: ['calendar-tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks/calendar');
      return data.data as CalendarTask[];
    },
  });
}
