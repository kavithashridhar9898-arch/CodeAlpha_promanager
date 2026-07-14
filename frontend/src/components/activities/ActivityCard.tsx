import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityLog } from '../../hooks/useActivities';

interface ActivityCardProps {
  activity: ActivityLog;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  return (
    <div className="flex gap-4 p-4 hover:bg-slate-800/50 rounded-xl transition-colors">
      <div className="flex-shrink-0 mt-1">
        {activity.user.avatarUrl ? (
          <img src={activity.user.avatarUrl} alt={activity.user.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            {activity.user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-300">
          <span className="font-semibold text-white">{activity.user.name}</span>{' '}
          {activity.description}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
          <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
          {activity.task && (
            <>
              <span>•</span>
              <span className="text-indigo-400/80 truncate border border-indigo-500/20 px-2 py-0.5 rounded-md bg-indigo-500/10">
                {activity.task.title}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
