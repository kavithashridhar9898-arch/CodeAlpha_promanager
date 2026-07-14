import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useMarkNotificationRead, useDeleteNotification, type Notification } from '../../hooks/useNotifications';
import { Check, Trash2, Info, CheckSquare, MessageSquare, Briefcase, UserPlus } from 'lucide-react';

interface Props {
  notification: Notification;
}

export const NotificationCard: React.FC<Props> = ({ notification }) => {
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: deleteNotif } = useDeleteNotification();
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      markRead(notification.id);
    } else {
      deleteNotif(notification.id);
    }
  };

  const handleClick = () => {
    if (!notification.isRead) markRead(notification.id);
    
    // Attempt navigation based on reference
    if (notification.referenceType === 'PROJECT' && notification.referenceId) {
      navigate(`/projects/${notification.referenceId}`);
    } else if (notification.referenceType === 'TASK' && notification.referenceId) {
      // For tasks, we typically navigate to the project and open the task drawer. 
      // But we might only have task ID here. For now, if we can't easily resolve the project,
      // we could rely on a global search or an endpoint. 
      // Let's just use a stub or if there's a task view, route to it.
      // Easiest is to let them know it's a task.
      // A more complex app would have a /tasks/:id endpoint that resolves the project.
    }
  };

  // Determine icon based on type
  const getIcon = () => {
    if (notification.type.includes('TASK')) return <CheckSquare className="w-5 h-5 text-emerald-400" />;
    if (notification.type.includes('COMMENT')) return <MessageSquare className="w-5 h-5 text-blue-400" />;
    if (notification.type.includes('PROJECT_INVITE') || notification.type.includes('PROJECT_ADDED')) return <UserPlus className="w-5 h-5 text-purple-400" />;
    if (notification.type.includes('PROJECT')) return <Briefcase className="w-5 h-5 text-indigo-400" />;
    return <Info className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div 
      onClick={handleClick}
      className={`group relative p-3 rounded-xl transition-all cursor-pointer flex gap-3 ${
        notification.isRead 
          ? 'bg-slate-900/40 hover:bg-slate-800/60 opacity-70 hover:opacity-100' 
          : 'bg-indigo-950/20 hover:bg-indigo-900/30 border border-indigo-500/10 shadow-sm'
      }`}
    >
      {!notification.isRead && (
        <div className="absolute top-1/2 -left-1 w-2 h-2 rounded-full bg-indigo-500 -translate-y-1/2"></div>
      )}
      
      <div className="shrink-0 mt-0.5">
        <div className={`p-2 rounded-lg ${notification.isRead ? 'bg-slate-800' : 'bg-slate-900 shadow-inner'}`}>
          {getIcon()}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5 gap-2">
          <h4 className={`text-sm truncate ${notification.isRead ? 'font-medium text-gray-300' : 'font-bold text-white'}`}>
            {notification.title}
          </h4>
          <span className="text-[10px] text-gray-500 shrink-0 whitespace-nowrap mt-0.5">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
      </div>

      <div className="shrink-0 flex items-center self-start opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleAction}
          className={`p-1.5 rounded-lg transition-colors ${
            !notification.isRead 
              ? 'text-indigo-400 hover:bg-indigo-500/20' 
              : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
          }`}
          title={!notification.isRead ? "Mark as read" : "Delete"}
        >
          {!notification.isRead ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
