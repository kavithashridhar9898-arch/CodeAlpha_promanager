'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { motion } from 'framer-motion';
import { Shield, Clock, User, Loader2, Filter } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: { id: string; name: string; email: string; avatarUrl?: string };
  project: { id: string; name: string };
  taskId?: string;
}

const ACTION_COLORS: Record<string, string> = {
  TASK_CREATED: 'text-emerald-400 bg-emerald-400/10',
  TASK_UPDATED: 'text-blue-400 bg-blue-400/10',
  TASK_DELETED: 'text-rose-400 bg-rose-400/10',
  TASK_MOVED: 'text-amber-400 bg-amber-400/10',
  TASK_ASSIGNED: 'text-violet-400 bg-violet-400/10',
  COMMENT_ADDED: 'text-sky-400 bg-sky-400/10',
  MEMBER_ADDED: 'text-teal-400 bg-teal-400/10',
  MEMBER_REMOVED: 'text-orange-400 bg-orange-400/10',
  PROJECT_CREATED: 'text-indigo-400 bg-indigo-400/10',
  PROJECT_ARCHIVED: 'text-amber-400 bg-amber-400/10',
};

const DEFAULT_COLOR = 'text-muted-foreground bg-secondary';

export function AuditLogTab() {
  const [filterAction, setFilterAction] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['audit-logs', filterAction],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterAction) params.set('action', filterAction);
      const { data } = await api.get(`/activity?${params}`);
      return data.data || [];
    },
  });

  const logs = data || [];
  const paginated = logs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(logs.length / PAGE_SIZE);

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Audit Log</h2>
        <p className="text-sm text-muted-foreground mt-1">
          A full history of actions taken across all your projects.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
          className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">All Actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">{logs.length} entries</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">No audit logs yet.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {paginated.map((log, idx) => {
              const colorClass = ACTION_COLORS[log.action] || DEFAULT_COLOR;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex gap-4 pl-12 relative"
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-3.5 top-3 w-3 h-3 rounded-full border-2 border-background ${colorClass.split(' ')[1]} ring-1 ring-border`} />

                  <div className="flex-1 p-4 bg-card border border-border rounded-2xl hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${colorClass}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-2 leading-relaxed">{log.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.user?.name || 'Unknown'}
                      </span>
                      {log.project && (
                        <span className="px-2 py-0.5 bg-secondary rounded-md text-[11px]">
                          {log.project.name}
                        </span>
                      )}
                      <span className="ml-auto text-[10px]">{format(new Date(log.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-secondary border border-border rounded-xl text-sm font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-4 py-2 bg-secondary border border-border rounded-xl text-sm font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
