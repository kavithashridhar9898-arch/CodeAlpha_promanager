'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/store/socketStore';
import { useAuthStore } from '@/store/authStore';

export function useRealtime() {
  const { connect, disconnect, socket, isConnected } = useSocketStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
  }, [isAuthenticated, connect, disconnect]);

  return { socket, isConnected };
}
