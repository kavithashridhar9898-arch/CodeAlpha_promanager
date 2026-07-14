import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../lib/socket';
import type { Notification } from './useNotifications';

export function useGlobalSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // The backend `socket/index.ts` automatically puts the user in a `user:${userId}` room on connection,
    // so we just need to listen for events.

    const handleNewNotification = (notification: Notification) => {
      // Add the new notification to the cache
      queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
        return old ? [notification, ...old] : [notification];
      });

      // Optionally trigger a toast here if you have a toast library setup
      // toast.info(notification.title, { description: notification.message });
    };

    socket.on('notification_new', handleNewNotification);

    return () => {
      socket.off('notification_new', handleNewNotification);
    };
  }, [queryClient]);
}
