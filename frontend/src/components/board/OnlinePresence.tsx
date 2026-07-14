import React from 'react';
import type { OnlineUser } from '../../hooks/useProjectSocket';

interface Props {
  onlineUsers: OnlineUser[];
  allMembers: { user: { id: string; name: string; avatarUrl?: string } }[];
}

export const OnlinePresence: React.FC<Props> = ({ onlineUsers, allMembers }) => {
  const onlineIds = new Set(onlineUsers.map((u) => u.userId));

  return (
    <div className="flex items-center gap-2">
      {/* Show up to 5 avatars */}
      <div className="flex -space-x-2">
        {allMembers.slice(0, 5).map(({ user }) => {
          const isOnline = onlineIds.has(user.id);
          return (
            <div key={user.id} className="relative group" title={`${user.name} — ${isOnline ? 'Online' : 'Offline'}`}>
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className={`w-8 h-8 rounded-full ring-2 transition-all ${
                    isOnline ? 'ring-emerald-500' : 'ring-slate-700'
                  }`}
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-full ring-2 flex items-center justify-center text-xs font-bold text-white transition-all ${
                    isOnline
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-emerald-500'
                      : 'bg-slate-700 ring-slate-600'
                  }`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Green dot */}
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-pulse" />
              )}
            </div>
          );
        })}
        {allMembers.length > 5 && (
          <div className="w-8 h-8 rounded-full ring-2 ring-slate-700 bg-slate-800 flex items-center justify-center text-xs font-bold text-gray-400">
            +{allMembers.length - 5}
          </div>
        )}
      </div>

      {/* Online count label */}
      <span className="text-xs text-gray-500 hidden sm:block">
        {onlineUsers.length === 0
          ? 'No one online'
          : `${onlineUsers.length} online`}
      </span>
    </div>
  );
};
