'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Loader2, Trash2, CheckSquare, MessageSquare, Briefcase, UserPlus, Info } from 'lucide-react';
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useDeleteNotification, type Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications, isLoading, error } = useNotifications();
  const { mutateAsync: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[32rem] z-50"
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-semibold">
                    {unreadCount}
                  </span>
                )}
              </h3>
              
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllRead()}
                  disabled={isMarkingAll}
                  className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 disabled:opacity-50 transition-colors"
                >
                  {isMarkingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="p-6 text-center text-destructive text-sm">
                  Failed to load notifications.
                </div>
              ) : !notifications || notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">You have no new notifications.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationCard 
                    key={notification.id} 
                    notification={notification} 
                    onClose={() => setIsOpen(false)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationCard({ notification, onClose }: { notification: Notification, onClose: () => void }) {
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: deleteNotif } = useDeleteNotification();
  const router = useRouter();

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
    
    if (notification.referenceType === 'PROJECT' && notification.referenceId) {
      router.push(`/dashboard/projects/${notification.referenceId}`);
      onClose();
    } else if (notification.referenceType === 'TASK' && notification.referenceId) {
      // Just mark it as read for now, navigating to a task specifically needs the project ID usually
      // or a global search capability if we implement global task lookup
    }
  };

  const getIcon = () => {
    if (notification.type.includes('TASK')) return <CheckSquare className="w-5 h-5 text-emerald-400" />;
    if (notification.type.includes('COMMENT')) return <MessageSquare className="w-5 h-5 text-blue-400" />;
    if (notification.type.includes('PROJECT_INVITE') || notification.type.includes('PROJECT_ADDED')) return <UserPlus className="w-5 h-5 text-purple-400" />;
    if (notification.type.includes('PROJECT')) return <Briefcase className="w-5 h-5 text-indigo-400" />;
    return <Info className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <div 
      onClick={handleClick}
      className={`group relative p-3 rounded-xl transition-all cursor-pointer flex gap-3 ${
        notification.isRead 
          ? 'bg-secondary/40 hover:bg-secondary/80 opacity-70 hover:opacity-100' 
          : 'bg-primary/10 hover:bg-primary/20 border border-primary/20 shadow-sm'
      }`}
    >
      {!notification.isRead && (
        <div className="absolute top-1/2 -left-1 w-2 h-2 rounded-full bg-primary -translate-y-1/2"></div>
      )}
      
      <div className="shrink-0 mt-0.5">
        <div className={`p-2 rounded-lg ${notification.isRead ? 'bg-secondary' : 'bg-background shadow-inner'}`}>
          {getIcon()}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5 gap-2">
          <h4 className={`text-sm truncate ${notification.isRead ? 'font-medium text-foreground/80' : 'font-bold text-foreground'}`}>
            {notification.title}
          </h4>
          <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap mt-0.5">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
      </div>

      <div className="shrink-0 flex items-center self-start opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleAction}
          className={`p-1.5 rounded-lg transition-colors ${
            !notification.isRead 
              ? 'text-primary hover:bg-primary/20' 
              : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
          }`}
          title={!notification.isRead ? "Mark as read" : "Delete"}
        >
          {!notification.isRead ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
