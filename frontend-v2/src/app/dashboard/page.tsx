'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, Users, CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useDashboardOverview, useDashboardAnalytics } from '@/hooks/useDashboard';

const StatCard = ({ title, value, change, icon: Icon, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <Icon className="w-5 h-5" />
      </div>
      <span className={`text-sm font-medium ${change >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
        {change >= 0 ? '+' : ''}{change}%
      </span>
    </div>
    <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
    <h3 className="text-3xl font-bold tracking-tight text-foreground">{value}</h3>
  </motion.div>
);

export default function DashboardPage() {
  const { data: overview, isLoading: isOverviewLoading, error: overviewError } = useDashboardOverview();
  const { data: analytics, isLoading: isAnalyticsLoading } = useDashboardAnalytics();

  if (isOverviewLoading || isAnalyticsLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Gathering your analytics...</p>
      </div>
    );
  }

  if (overviewError || !overview) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive max-w-md text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-80" />
          <h2 className="text-lg font-bold mb-1">Failed to load dashboard</h2>
          <p className="text-sm opacity-80">We couldn't fetch your analytics data right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex items-end justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening in your workspace today.</p>
        </motion.div>
        
        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          Generate Report
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Projects" value={overview.activeProjects} change={0} icon={TrendingUp} delay={0.1} />
        <StatCard title="Tasks Completed" value={overview.completedTasks} change={0} icon={CheckCircle2} delay={0.2} />
        <StatCard title="Pending Tasks" value={overview.pendingTasks} change={0} icon={Users} delay={0.3} />
        <StatCard title="Overdue Tasks" value={overview.overdueTasks} change={0} icon={Clock} delay={0.4} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-sm"
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Task Completion Activity</h3>
            <p className="text-sm text-muted-foreground">Daily tasks completed over the last 7 days</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.weeklyProductivity || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12 }} dy={10} 
                       tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '12px' }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString()}
                />
                <Bar dataKey="completed" name="Tasks Completed" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Secondary Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col"
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Productivity Score</h3>
            <p className="text-sm text-muted-foreground">Monthly performance trend</p>
          </div>
          <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.teamWorkload || []} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="tasks" name="Active Tasks" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
