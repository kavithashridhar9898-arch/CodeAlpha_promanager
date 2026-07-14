import React from 'react';
import { useNotifications, useMarkAllNotificationsRead } from '../../hooks/useNotifications';
import { NotificationCard } from './NotificationCard';
import { Bell, Check, Loader2 } from 'lucide-react';

export const NotificationList: React.FC = () => {
  const { data: notifications, isLoading, error } = useNotifications();
  const { mutateAsync: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[32rem]">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-400" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        
        {unreadCount > 0 && (
          <button 
            onClick={() => markAllRead()}
            disabled={isMarkingAll}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50 transition-colors"
          >
            {isMarkingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 text-sm">
            Failed to load notifications.
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-white">All caught up!</p>
            <p className="text-xs text-gray-500 mt-1">You have no new notifications.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))
        )}
      </div>
    </div>
  );
};
