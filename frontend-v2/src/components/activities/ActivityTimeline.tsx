'use client';

import React, { useState } from 'react';
import { useProjectActivity } from '@/hooks/useActivities';
import { ActivityCard } from './ActivityCard';
import { Filter, Loader2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityTimelineProps {
  projectId: string;
}

type FilterType = 'ALL' | 'PROJECT' | 'TASK' | 'COMMENT' | 'MEMBER';

export function ActivityTimeline({ projectId }: ActivityTimelineProps) {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const { data: activities, isLoading, error } = useProjectActivity(projectId);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive p-4 bg-destructive/10 rounded-xl text-center font-medium border border-destructive/20">
        Failed to load activity logs.
      </div>
    );
  }

  const filteredActivities = activities?.filter((activity) => {
    if (filter === 'ALL') return true;
    if (filter === 'PROJECT') return activity.action.startsWith('PROJECT_');
    if (filter === 'TASK') return activity.action.startsWith('TASK_');
    if (filter === 'COMMENT') return activity.action.startsWith('COMMENT_');
    if (filter === 'MEMBER') return activity.action.startsWith('MEMBER_');
    return true;
  }) || [];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-border hide-scrollbar">
        <Filter className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
        {(['ALL', 'PROJECT', 'TASK', 'COMMENT', 'MEMBER'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all shrink-0 ${
              filter === f
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
            }`}
          >
            {f === 'ALL' ? 'All Activity' : f.charAt(0) + f.slice(1).toLowerCase() + 's'}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredActivities.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <History className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">No activities found for this filter.</p>
            </motion.div>
          ) : (
            filteredActivities.map((activity, index) => (
              <ActivityCard key={activity.id} activity={activity} index={index} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
