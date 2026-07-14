import { useEffect, useCallback } from 'react';
import type React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../lib/socket';
import type { Board, Task, BoardColumn } from './useBoard';
import type { Comment } from './useComments';
import type { ActivityLog } from './useActivities';

// ── Types mirrored from the server ───────────────────────────────────────────
export interface OnlineUser {
  userId: string;
  userName: string;
  avatarUrl?: string;
  socketId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useProjectSocket(
  projectId: string | undefined,
  onOnlineUsersChange?: React.Dispatch<React.SetStateAction<OnlineUser[]>>,
  onTyping?: (payload: { userId: string; userName: string; taskId: string }) => void,
  onStoppedTyping?: (payload: { userId: string; taskId: string }) => void,
) {
  const queryClient = useQueryClient();

  // ── Board cache helpers ───────────────────────────────────────────────────
  const boardKey = ['board', projectId];

  const updateTaskInBoard = useCallback(
    (updatedTask: Task) => {
      queryClient.setQueryData<Board>(boardKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map((col: BoardColumn) => ({
            ...col,
            tasks: col.tasks.map((t: Task) =>
              t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
            ),
          })),
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, projectId],
  );

  const addTaskToBoard = useCallback(
    (newTask: Task) => {
      queryClient.setQueryData<Board>(boardKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map((col: BoardColumn) =>
            col.id === newTask.columnId
              ? { ...col, tasks: [...col.tasks, newTask] }
              : col,
          ),
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, projectId],
  );

  const removeTaskFromBoard = useCallback(
    (taskId: string) => {
      queryClient.setQueryData<Board>(boardKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map((col: BoardColumn) => ({
            ...col,
            tasks: col.tasks.filter((t: Task) => t.id !== taskId),
          })),
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, projectId],
  );

  const moveTaskInBoard = useCallback(
    (taskId: string, newColumnId: string, newOrder: number, fullTask?: Task) => {
      queryClient.setQueryData<Board>(boardKey, (old) => {
        if (!old) return old;
        // Remove from old column
        let movedTask: Task | undefined;
        const withoutTask = old.columns.map((col: BoardColumn) => {
          const filtered = col.tasks.filter((t: Task) => {
            if (t.id === taskId) { movedTask = t; return false; }
            return true;
          });
          return { ...col, tasks: filtered };
        });
        if (!movedTask && fullTask) movedTask = fullTask;
        if (!movedTask) return old;

        movedTask = { ...movedTask, ...(fullTask ?? {}), columnId: newColumnId, order: newOrder };

        // Insert into new column at correct order
        return {
          ...old,
          columns: withoutTask.map((col: BoardColumn) => {
            if (col.id !== newColumnId) return col;
            const tasks = [...col.tasks];
            tasks.splice(newOrder, 0, movedTask!);
            return { ...col, tasks };
          }),
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, projectId],
  );

  // ── Comment cache helpers ─────────────────────────────────────────────────

  const addCommentToCache = useCallback(
    (newComment: Comment) => {
      queryClient.setQueryData<Comment[]>(['comments', newComment.taskId], (old = []) => {
        if (old.some((c) => c.id === newComment.id)) return old;
        return [...old, newComment];
      });
    },
    [queryClient],
  );

  const updateCommentInCache = useCallback(
    (updatedComment: Comment) => {
      queryClient.setQueryData<Comment[]>(['comments', updatedComment.taskId], (old = []) =>
        old.map((c) => (c.id === updatedComment.id ? updatedComment : c)),
      );
    },
    [queryClient],
  );

  const removeCommentFromCache = useCallback(
    (commentId: string, taskId: string) => {
      queryClient.setQueryData<Comment[]>(['comments', taskId], (old = []) =>
        old.filter((c) => c.id !== commentId),
      );
    },
    [queryClient],
  );

  // ── Activity cache helper ─────────────────────────────────────────────────
  const addActivityToCache = useCallback(
    (newActivity: ActivityLog) => {
      // Find all queries matching 'activities' and this projectId to prepend the new activity
      queryClient.setQueriesData<ActivityLog[]>(
        { queryKey: ['activities', projectId] },
        (old = []) => {
          if (old.some((a) => a.id === newActivity.id)) return old;
          return [newActivity, ...old];
        }
      );
    },
    [queryClient, projectId]
  );

  // ── Effect: join room + register listeners ────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_project', projectId);

    // Presence
    socket.on('online_users', (users: OnlineUser[]) => {
      onOnlineUsersChange?.(users);
    });
    socket.on('user_online', (user: OnlineUser) => {
      onOnlineUsersChange?.((prev: OnlineUser[] | undefined) => {
        const list = prev ?? [];
        if (list.some((u) => u.userId === user.userId)) return list;
        return [...list, user];
      });
    });
    socket.on('user_offline', ({ userId }: { userId: string }) => {
      onOnlineUsersChange?.((prev: OnlineUser[] | undefined) =>
        (prev ?? []).filter((u) => u.userId !== userId),
      );
    });

    // Typing
    socket.on('user_typing', onTyping ?? (() => {}));
    socket.on('user_stopped_typing', onStoppedTyping ?? (() => {}));

    // Tasks
    socket.on('task_created', (task: unknown) => {
      addTaskToBoard(task as Task);
    });
    socket.on('task_updated', (task: unknown) => {
      updateTaskInBoard(task as Task);
    });
    socket.on('task_assigned', (task: unknown) => {
      updateTaskInBoard(task as Task);
    });
    socket.on('task_deleted', ({ taskId }: { taskId: string; columnId: string }) => {
      removeTaskFromBoard(taskId);
    });
    socket.on('task_moved', ({ taskId, columnId, order, task }: { taskId: string; columnId: string; order: number; task: unknown }) => {
      moveTaskInBoard(taskId, columnId, order, task as Task);
    });

    // Comments
    socket.on('comment_created', (comment: unknown) => {
      addCommentToCache(comment as Comment);
    });
    socket.on('comment_updated', (comment: unknown) => {
      updateCommentInCache(comment as Comment);
    });
    socket.on('comment_deleted', ({ commentId, taskId }: { commentId: string; taskId: string }) => {
      removeCommentFromCache(commentId, taskId);
    });

    // Activities
    socket.on('activity_created', (activity: unknown) => {
      addActivityToCache(activity as ActivityLog);
    });

    return () => {
      socket.emit('leave_project', projectId);
      socket.off('online_users');
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('task_created');
      socket.off('task_updated');
      socket.off('task_assigned');
      socket.off('task_deleted');
      socket.off('task_moved');
      socket.off('comment_created');
      socket.off('comment_updated');
      socket.off('comment_deleted');
      socket.off('activity_created');
    };
  // Intentionally not re-registering when callbacks change — use stable refs via useCallback above
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);
}
