import React, { useEffect } from 'react';
import { 
  useDashboardOverview, 
  useDashboardAnalytics 
} from '../hooks/useDashboard';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend 
} from 'recharts';
import { 
  Briefcase, CheckSquare, Clock, AlertTriangle, Users, 
  Calendar, ArrowRight, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../lib/socket';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const STATUS_COLORS: Record<string, string> = {
  'TODO': '#94a3b8',
  'IN_PROGRESS': '#3b82f6',
  'IN_REVIEW': '#f59e0b',
  'DONE': '#10b981',
};
const PRIORITY_COLORS: Record<string, string> = {
  'LOW': '#94a3b8',
  'MEDIUM': '#3b82f6',
  'HIGH': '#f59e0b',
  'URGENT': '#ef4444',
};

export const Dashboard: React.FC = () => {
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview();
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics();
  const queryClient = useQueryClient();

  // Listen for socket events to invalidate dashboard queries and keep them fresh
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    socket.on('task_created', handleUpdate);
    socket.on('task_updated', handleUpdate);
    socket.on('task_deleted', handleUpdate);
    socket.on('task_moved', handleUpdate);
    socket.on('activity_created', handleUpdate);

    return () => {
      socket.off('task_created', handleUpdate);
      socket.off('task_updated', handleUpdate);
      socket.off('task_deleted', handleUpdate);
      socket.off('task_moved', handleUpdate);
      socket.off('activity_created', handleUpdate);
    };
  }, [queryClient]);

  if (overviewLoading || analyticsLoading || !overview || !analytics) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Here's what's happening across your projects today.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Active Projects</h3>
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{overview.activeProjects}</p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Completed Tasks</h3>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{overview.completedTasks}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Pending Tasks</h3>
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{overview.pendingTasks}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Overdue Tasks</h3>
            <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{overview.overdueTasks}</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Task Status Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-96">
          <h3 className="text-lg font-semibold text-white mb-4">Task Status Distribution</h3>
          {analytics.statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {analytics.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
          )}
        </div>

        {/* Weekly Productivity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-96">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Productivity (Completed Tasks)</h3>
          {analytics.weeklyProductivity.some(d => d.completed > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.weeklyProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
          )}
        </div>

        {/* Project Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-96">
          <h3 className="text-lg font-semibold text-white mb-4">Project Progress</h3>
          {analytics.projectProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.projectProgress} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{ fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                />
                <Legend />
                <Bar dataKey="total" name="Total Tasks" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
          )}
        </div>

        {/* Team Workload */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-96">
          <h3 className="text-lg font-semibold text-white mb-4">Team Workload</h3>
          {analytics.teamWorkload.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.teamWorkload}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                />
                <Bar dataKey="tasks" name="Assigned Tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {analytics.teamWorkload.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">No tasks assigned to team members</div>
          )}
        </div>

      </div>

      {/* Lower Section Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upcoming Deadlines */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-96">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Upcoming Deadlines
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {overview.upcomingDeadlines.length > 0 ? (
              overview.upcomingDeadlines.map((task) => (
                <Link 
                  key={task.id} 
                  to={`/projects/${task.column.board.projectId}`}
                  className="block p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium text-white truncate pr-2">{task.title}</h4>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-red-500/10 text-red-400 shrink-0">
                      {format(new Date(task.dueDate!), 'MMM d')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center justify-between">
                    <span>{task.column.board.project.name}</span>
                    <span className="text-indigo-400 flex items-center gap-1">
                      View <ArrowRight className="w-3 h-3" />
                    </span>
                  </p>
                </Link>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                No upcoming deadlines
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-96">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Recent Activity
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {overview.recentActivity.length > 0 ? (
              overview.recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4 p-3 hover:bg-slate-800/30 rounded-xl transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {activity.user.avatarUrl ? (
                      <img src={activity.user.avatarUrl} alt={activity.user.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {activity.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-white">{activity.user.name}</span>{' '}
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                No recent activity found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Activity Icon component since Activity is not imported above directly
function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
