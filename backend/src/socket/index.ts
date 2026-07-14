import type { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/database';

// ─────────────────────────────────────────────────────────────────────────────
// Event type contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  // Tasks
  task_created:   (task: Record<string, unknown>) => void;
  task_updated:   (task: Record<string, unknown>) => void;
  task_deleted:   (payload: { taskId: string; columnId: string }) => void;
  task_moved:     (payload: { taskId: string; columnId: string; order: number; task: Record<string, unknown> }) => void;
  task_assigned:  (task: Record<string, unknown>) => void;

  // Comments
  comment_created: (comment: Record<string, unknown>) => void;
  comment_updated: (comment: Record<string, unknown>) => void;
  comment_deleted: (payload: { commentId: string; taskId: string }) => void;

  // Activities
  activity_created: (activity: Record<string, unknown>) => void;

  // Presence
  user_online:  (user: OnlineUser) => void;
  user_offline: (payload: { userId: string }) => void;
  online_users: (users: OnlineUser[]) => void;

  // Notifications
  notification_new: (notification: Record<string, unknown>) => void;

  // Typing
  user_typing:        (payload: { userId: string; userName: string; taskId: string }) => void;
  user_stopped_typing:(payload: { userId: string; taskId: string }) => void;
}

export interface ClientToServerEvents {
  // Rooms
  join_project:  (projectId: string) => void;
  leave_project: (projectId: string) => void;

  // Typing
  typing_start: (payload: { taskId: string }) => void;
  typing_stop:  (payload: { taskId: string }) => void;
}

export interface OnlineUser {
  userId:   string;
  userName: string;
  avatarUrl?: string;
  socketId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory presence store  projectId → Set<OnlineUser>
// ─────────────────────────────────────────────────────────────────────────────
const projectPresence = new Map<string, Map<string, OnlineUser>>();

function addPresence(projectId: string, user: OnlineUser) {
  if (!projectPresence.has(projectId)) projectPresence.set(projectId, new Map());
  projectPresence.get(projectId)!.set(user.userId, user);
}

function removePresence(projectId: string, userId: string) {
  projectPresence.get(projectId)?.delete(userId);
}

function getPresence(projectId: string): OnlineUser[] {
  return Array.from(projectPresence.get(projectId)?.values() ?? []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Augment socket data type
// ─────────────────────────────────────────────────────────────────────────────
interface SocketData {
  userId:    string;
  userName:  string;
  userEmail: string;
  avatarUrl?: string;
  joinedProjects: Set<string>;
}

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

// ─────────────────────────────────────────────────────────────────────────────
// Initializer
// ─────────────────────────────────────────────────────────────────────────────
export function initializeSocket(httpServer: HttpServer): Server<ClientToServerEvents, ServerToClientEvents> {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── JWT Authentication middleware ─────────────────────────────────────────
  io.use((socket: AppSocket, next) => {
    const token =
      (socket.handshake.auth as { token?: string }).token ||
      (socket.handshake.headers.authorization ?? '').replace('Bearer ', '');

    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = verifyToken(token);
      socket.data.userId    = decoded.id;
      socket.data.userName  = decoded.name;
      socket.data.userEmail = decoded.email;
      socket.data.joinedProjects = new Set();
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection ────────────────────────────────────────────────────────────
  io.on('connection', (socket: AppSocket) => {
    const { userId, userName } = socket.data;
    console.log(`🔌 Socket connected: ${socket.id} (user ${userName})`);

    // Join personal room for private notifications
    socket.join(`user:${userId}`);

    // ── join-project ─────────────────────────────────────────────────────────
    socket.on('join_project', async (projectId) => {
      try {
        // Verify membership
        const member = await prisma.projectMember.findUnique({
          where: { userId_projectId: { userId, projectId } },
        });
        const project = member
          ? null
          : await prisma.project.findUnique({ where: { id: projectId } });

        const isMember = !!member;
        const isOwner  = !member && project?.ownerId === userId;

        if (!isMember && !isOwner) {
          socket.emit('user_offline', { userId }); // silent auth failure
          return;
        }

        socket.join(`project:${projectId}`);
        socket.data.joinedProjects.add(projectId);

        // Fetch avatar
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { avatarUrl: true },
        });

        const onlineUser: OnlineUser = {
          userId,
          userName,
          avatarUrl: user?.avatarUrl ?? undefined,
          socketId: socket.id,
        };

        addPresence(projectId, onlineUser);

        // Send current online list to the newcomer
        socket.emit('online_users', getPresence(projectId));

        // Announce to others in the room
        socket.to(`project:${projectId}`).emit('user_online', onlineUser);

        console.log(`   ↳ ${userName} joined project:${projectId}`);
      } catch (err) {
        console.error('join_project error', err);
      }
    });

    // ── leave-project ─────────────────────────────────────────────────────────
    socket.on('leave_project', (projectId) => {
      socket.leave(`project:${projectId}`);
      socket.data.joinedProjects.delete(projectId);
      removePresence(projectId, userId);
      io.to(`project:${projectId}`).emit('user_offline', { userId });
      console.log(`   ↳ ${userName} left project:${projectId}`);
    });

    // ── Typing indicators ─────────────────────────────────────────────────────
    socket.on('typing_start', ({ taskId }) => {
      // Broadcast to everyone in the task's project rooms
      socket.data.joinedProjects.forEach((projectId) => {
        socket.to(`project:${projectId}`).emit('user_typing', {
          userId,
          userName,
          taskId,
        });
      });
    });

    socket.on('typing_stop', ({ taskId }) => {
      socket.data.joinedProjects.forEach((projectId) => {
        socket.to(`project:${projectId}`).emit('user_stopped_typing', { userId, taskId });
      });
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Disconnected: ${socket.id} (${userName}) — ${reason}`);
      // Clean up presence for all joined projects
      socket.data.joinedProjects?.forEach((projectId) => {
        removePresence(projectId, userId);
        io.to(`project:${projectId}`).emit('user_offline', { userId });
      });
    });
  });

  return io;
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton io accessor & broadcast helpers
// ─────────────────────────────────────────────────────────────────────────────
let _io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

export function setIo(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  _io = io;
}

export function getIo(): Server<ClientToServerEvents, ServerToClientEvents> {
  if (!_io) throw new Error('Socket.IO not initialized');
  return _io;
}

/** Emit to everyone in a project room (including sender) */
export function emitToProject(
  projectId: string,
  event: keyof ServerToClientEvents,
  data: unknown,
) {
  _io?.to(`project:${projectId}`).emit(event as keyof ServerToClientEvents, data as any);
}

/** Emit to everyone in a project room EXCEPT sender socket */
export function emitToProjectExcept(
  projectId: string,
  senderSocketId: string,
  event: keyof ServerToClientEvents,
  data: unknown,
) {
  _io?.to(`project:${projectId}`).except(senderSocketId).emit(event as keyof ServerToClientEvents, data as any);
}

/** Emit to a specific user's personal room */
export function emitToUser(
  userId: string,
  event: keyof ServerToClientEvents,
  data: unknown,
) {
  _io?.to(`user:${userId}`).emit(event as keyof ServerToClientEvents, data as any);
}
