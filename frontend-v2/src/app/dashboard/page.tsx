'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, CheckCircle2, Clock, Loader2, AlertCircle, GripVertical, LayoutGrid } from 'lucide-react';
import { useDashboardOverview, useDashboardAnalytics } from '@/hooks/useDashboard';
import { PendingInvitations } from '@/components/invitations/PendingInvitations';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── Widget definitions ─────────────────────────────────────────────────────────

const INITIAL_WIDGET_ORDER = ['active_projects', 'completed_tasks', 'pending_tasks', 'overdue_tasks'];

function getWidgetData(id: string, overview: any) {
  switch (id) {
    case 'active_projects': return { title: 'Active Projects', value: overview.activeProjects, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10' };
    case 'completed_tasks': return { title: 'Tasks Completed', value: overview.completedTasks, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    case 'pending_tasks': return { title: 'Pending Tasks', value: overview.pendingTasks, icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' };
    case 'overdue_tasks': return { title: 'Overdue Tasks', value: overview.overdueTasks, icon: Clock, color: 'text-rose-400', bg: 'bg-rose-500/10' };
    default: return null;
  }
}

// ── Sortable stat card ─────────────────────────────────────────────────────────

function SortableStatCard({ id, overview }: { id: string; overview: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const widget = getWidgetData(id, overview);
  if (!widget) return null;
  const Icon = widget.icon;

  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' }}
      className={`relative p-6 rounded-2xl bg-card border transition-all ${
        isDragging ? 'border-primary shadow-2xl shadow-primary/20 scale-[1.03] opacity-90' : 'border-border shadow-sm hover:shadow-md'
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${widget.bg} flex items-center justify-center ${widget.color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground font-medium mb-1">{widget.title}</p>
      <h3 className="text-3xl font-bold tracking-tight text-foreground">{widget.value ?? '—'}</h3>
    </motion.div>
  );
}

// ── Main dashboard page ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: overview, isLoading: isOverviewLoading, error: overviewError } = useDashboardOverview();
  const { data: analytics, isLoading: isAnalyticsLoading } = useDashboardAnalytics();

  // Widget order: persist in localStorage
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return INITIAL_WIDGET_ORDER;
    try {
      const saved = localStorage.getItem('dashboard_widget_order');
      return saved ? JSON.parse(saved) : INITIAL_WIDGET_ORDER;
    } catch {
      return INITIAL_WIDGET_ORDER;
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWidgetOrder((prev) => {
      const oldIdx = prev.indexOf(active.id as string);
      const newIdx = prev.indexOf(over.id as string);
      const next = arrayMove(prev, oldIdx, newIdx);
      try { localStorage.setItem('dashboard_widget_order', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

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
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening in your workspace today.</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 border border-border rounded-xl px-3 py-2"
        >
          <GripVertical className="w-3.5 h-3.5" />
          <span>Drag cards to reorder</span>
        </motion.div>
      </div>

      <PendingInvitations />

      {/* Draggable Stat Cards */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgetOrder} strategy={horizontalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 group">
            {widgetOrder.map((id) => (
              <SortableStatCard key={id} id={id} overview={overview} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
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
