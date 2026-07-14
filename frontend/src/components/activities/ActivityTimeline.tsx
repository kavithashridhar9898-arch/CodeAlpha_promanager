import React, { useState } from 'react';
import { useProjectActivity } from '../../hooks/useActivities';
import { ActivityCard } from './ActivityCard';
import { Filter } from 'lucide-react';

interface ActivityTimelineProps {
  projectId: string;
}

type FilterType = 'ALL' | 'PROJECT' | 'TASK' | 'COMMENT' | 'MEMBER';

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ projectId }) => {
  const [filter, setFilter] = useState<FilterType>('ALL');

  const { data: activities, isLoading, error } = useProjectActivity(projectId);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 p-4 bg-red-500/10 rounded-xl text-center">
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
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <Filter className="w-4 h-4 text-gray-500 mr-2" />
        {(['ALL', 'PROJECT', 'TASK', 'COMMENT', 'MEMBER'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {f === 'ALL' ? 'All Activity' : f.charAt(0) + f.slice(1).toLowerCase() + 's'}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No activities found for this filter.
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </div>
  );
};
