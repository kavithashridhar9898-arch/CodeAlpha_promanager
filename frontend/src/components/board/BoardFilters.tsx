import React from 'react';
import { Filter, X } from 'lucide-react';

export interface TaskFilters {
  priority?: string;
  status?: string;
  assigneeId?: string;
  sortBy?: 'NEWEST' | 'OLDEST' | 'PRIORITY' | 'DUE_DATE' | 'RECENTLY_UPDATED';
}

interface BoardFiltersProps {
  filters: TaskFilters;
  setFilters: React.Dispatch<React.SetStateAction<TaskFilters>>;
  members: Array<{ id: string; name: string }>;
}

export const BoardFilters: React.FC<BoardFiltersProps> = ({ filters, setFilters, members }) => {
  const handleChange = (key: keyof TaskFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).some((k) => filters[k as keyof TaskFilters] !== undefined);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-indigo-400 font-medium mr-2">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </div>

        <select
          value={filters.priority || ''}
          onChange={(e) => handleChange('priority', e.target.value)}
          className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Any Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        <select
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
          className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Any Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>

        <select
          value={filters.assigneeId || ''}
          onChange={(e) => handleChange('assigneeId', e.target.value)}
          className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Any Assignee</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
          <option value="unassigned">Unassigned</option>
        </select>

        <select
          value={filters.sortBy || ''}
          onChange={(e) => handleChange('sortBy', e.target.value)}
          className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Sort By (Default)</option>
          <option value="NEWEST">Newest First</option>
          <option value="OLDEST">Oldest First</option>
          <option value="PRIORITY">Highest Priority</option>
          <option value="DUE_DATE">Due Date</option>
          <option value="RECENTLY_UPDATED">Recently Updated</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-400 transition-colors ml-auto"
          >
            <X className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>
    </div>
  );
};
