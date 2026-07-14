import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:5000';

let socket: Socket | null = null;

/** Create (or return existing) authenticated socket */
export function getSocket(): Socket | null {
  const token = useAuthStore.getState().token;
  if (!token) return null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () =>
      console.log('[Socket] Connected:', socket?.id),
    );
    socket.on('disconnect', (reason) =>
      console.log('[Socket] Disconnected:', reason),
    );
    socket.on('connect_error', (err) =>
      console.error('[Socket] Auth/connect error:', err.message),
    );
  }

  return socket;
}

/** Tear down the socket on logout */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
