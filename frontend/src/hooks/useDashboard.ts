import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import type { Task } from './useBoard';
import type { ActivityLog } from './useActivities';

export interface DashboardOverview {
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  upcomingDeadlines: Task[];
  recentActivity: ActivityLog[];
  recentNotifications: any[];
}

export interface DashboardAnalytics {
  statusDistribution: { name: string; value: number }[];
  priorityDistribution: { name: string; value: number }[];
  projectProgress: { name: string; total: number; completed: number }[];
  teamWorkload: { name: string; tasks: number }[];
  weeklyProductivity: { date: string; completed: number }[];
}

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const { data } = await api.get<{ data: DashboardOverview }>('/dashboard');
      return data.data;
    },
  });
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ['dashboard', 'analytics'],
    queryFn: async () => {
      const { data } = await api.get<{ data: DashboardAnalytics }>('/charts');
      return data.data;
    },
  });
}
