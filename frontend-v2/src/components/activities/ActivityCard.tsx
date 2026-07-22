'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import type { ActivityLog } from '@/hooks/useActivities';

interface ActivityCardProps {
  activity: ActivityLog;
  index: number;
}

export function ActivityCard({ activity, index }: ActivityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-4 p-4 hover:bg-secondary/30 rounded-2xl transition-colors border border-transparent hover:border-border/50 group"
    >
      <div className="flex-shrink-0 mt-1 relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
        {activity.user.avatarUrl ? (
          <img src={activity.user.avatarUrl} alt={activity.user.name} className="w-10 h-10 rounded-full object-cover relative z-10 border border-border" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold relative z-10 border border-primary/20">
            {activity.user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-muted-foreground text-sm">
          <span className="font-semibold text-foreground">{activity.user.name}</span>{' '}
          {activity.description}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs font-medium text-muted-foreground/80">
          <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
          {activity.task && (
            <>
              <span>•</span>
              <span className="text-primary truncate border border-primary/20 px-2 py-0.5 rounded-md bg-primary/5">
                {activity.task.title}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
