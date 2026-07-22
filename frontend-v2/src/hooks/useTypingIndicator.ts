import { useEffect, useRef, useCallback, useState } from 'react';
import { useSocketStore } from '@/store/socketStore';

const TYPING_TIMEOUT_MS = 2500;

interface TypingUser {
  userId: string;
  userName: string;
}

/**
 * Returns:
 *   - `typingUsers`   — array of users currently typing in this task (excl. yourself)
 *   - `onStartTyping` — call when the textarea gets input
 *   - `onStopTyping`  — call when textarea loses focus / message sent
 */
export function useTypingIndicator(taskId: string, currentUserId: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const { socket } = useSocketStore();

  // Listen for incoming typing events on the socket
  useEffect(() => {
    if (!socket) return;

    const handleTyping = ({ userId, userName, taskId: tid }: { userId: string; userName: string; taskId: string }) => {
      if (tid !== taskId || userId === currentUserId) return;
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === userId)) return prev;
        return [...prev, { userId, userName }];
      });
    };

    const handleStopped = ({ userId, taskId: tid }: { userId: string; taskId: string }) => {
      if (tid !== taskId) return;
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    socket.on('user_typing', handleTyping);
    socket.on('user_stopped_typing', handleStopped);

    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stopped_typing', handleStopped);
    };
  }, [taskId, currentUserId]);

  const onStartTyping = useCallback(() => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing_start', { taskId });
    }

    // Reset the auto-stop timer
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing_stop', { taskId });
    }, TYPING_TIMEOUT_MS);
  }, [taskId]);

  const onStopTyping = useCallback(() => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typing_stop', { taskId });
    }
  }, [taskId]);

  return { typingUsers, onStartTyping, onStopTyping };
}
