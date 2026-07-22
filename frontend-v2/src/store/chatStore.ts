import { create } from 'zustand';
import { api } from '@/lib/axios';
import { useSocketStore } from './socketStore';
import { useAuthStore } from './authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageType = 'TEXT' | 'FILE' | 'IMAGE' | 'VOICE' | 'SYSTEM' | 'MEETING';
export type ConversationType = 'WORKSPACE' | 'TEAM' | 'PROJECT' | 'DIRECT' | 'GROUP';
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface MessageAttachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string | null;
  replyToId: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  mentionedUsers?: string[];
  metadata?: Record<string, unknown>;
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
  pinnedAs?: { id: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  description: string | null;
  avatarUrl: string | null;
  teamId: string | null;
  projectId: string | null;
  createdById: string;
  isArchived: boolean;
  unreadCount: number;
  lastMessage: ChatMessage | null;
  members: Array<{ userId: string; unreadCount: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  conversationId: string;
}

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
}

// ─── Audio Helper ─────────────────────────────────────────────────────────────

function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    // Ignore audio context errors
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ChatState {
  // Data
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, ChatMessage[]>; // conversationId → messages
  typingUsers: TypingIndicator[];
  presence: Record<string, PresenceStatus>;
  pinnedMessages: Record<string, ChatMessage[]>;

  // UI
  isLoading: boolean;
  isSending: boolean;
  hasMoreMessages: Record<string, boolean>;

  // Actions
  fetchConversations: () => Promise<void>;
  createConversation: (data: {
    type: ConversationType;
    name?: string;
    memberUserIds?: string[];
    targetUserId?: string;
    teamId?: string;
    projectId?: string;
  }) => Promise<Conversation>;
  setActiveConversation: (id: string | null) => void;
  fetchMessages: (conversationId: string, cursor?: string) => Promise<void>;
  sendMessage: (conversationId: string, data: {
    content?: string;
    type?: MessageType;
    replyToId?: string;
    files?: File[];
  }) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string, conversationId: string) => Promise<void>;
  toggleReaction: (messageId: string, conversationId: string, emoji: string) => Promise<void>;
  fetchPinnedMessages: (conversationId: string) => Promise<void>;
  pinMessage: (conversationId: string, messageId: string) => Promise<void>;
  unpinMessage: (conversationId: string, messageId: string) => Promise<void>;
  searchMessages: (query: string) => Promise<ChatMessage[]>;
  markRead: (conversationId: string) => Promise<void>;
  setPresence: (userId: string, status: PresenceStatus) => void;
  subscribeToSocket: () => void;
  unsubscribeFromSocket: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: [],
  presence: {},
  pinnedMessages: {},
  isLoading: false,
  isSending: false,
  hasMoreMessages: {},

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/chat/conversations');
      set({ conversations: res.data.data, isLoading: false });
      
      // Request notification permission on first load
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch {
      set({ isLoading: false });
    }
  },

  createConversation: async (data) => {
    const res = await api.post('/chat/conversations', data);
    const conversation = res.data.data;
    set((s) => ({ conversations: [conversation, ...s.conversations] }));
    return conversation;
  },

  setActiveConversation: (id) => {
    const prev = get().activeConversationId;
    if (prev) {
      const { socket } = useSocketStore.getState();
      socket?.emit('leave_conversation' as any, prev);
    }
    set({ activeConversationId: id });
    if (id) {
      const { socket } = useSocketStore.getState();
      socket?.emit('join_conversation' as any, id);
    }
  },

  fetchMessages: async (conversationId, cursor) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: { cursor, limit: 40 },
      });
      const newMessages: ChatMessage[] = res.data.data;
      set((s) => ({
        messages: {
          ...s.messages,
          [conversationId]: cursor
            ? [...newMessages, ...(s.messages[conversationId] || [])]
            : newMessages,
        },
        hasMoreMessages: {
          ...s.hasMoreMessages,
          [conversationId]: newMessages.length === 40,
        },
        isLoading: false,
      }));

      // Clear unread for this conversation
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c,
        ),
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  sendMessage: async (conversationId, { content, type, replyToId, files }) => {
    set({ isSending: true });
    try {
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (type) formData.append('type', type);
      if (replyToId) formData.append('replyToId', replyToId);
      files?.forEach((f) => formData.append('files', f));

      const res = await api.post(
        `/chat/conversations/${conversationId}/messages`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const message: ChatMessage = res.data.data;

      // Optimistically add message + broadcast via socket
      set((s) => ({
        messages: {
          ...s.messages,
          [conversationId]: [...(s.messages[conversationId] || []), message],
        },
        conversations: s.conversations.map((c) =>
          c.id === conversationId ? { ...c, lastMessage: message, updatedAt: new Date().toISOString() } : c,
        ),
        isSending: false,
      }));

      // Emit via socket for real-time delivery
      const { socket } = useSocketStore.getState();
      socket?.emit('chat_message' as any, { conversationId, message });
    } catch {
      set({ isSending: false });
    }
  },

  editMessage: async (messageId, content) => {
    const res = await api.patch(`/chat/messages/${messageId}`, { content });
    const updated: ChatMessage = res.data.data;

    set((s) => {
      const convMessages = s.messages[updated.conversationId] || [];
      return {
        messages: {
          ...s.messages,
          [updated.conversationId]: convMessages.map((m) =>
            m.id === messageId ? updated : m,
          ),
        },
      };
    });
  },

  deleteMessage: async (messageId, conversationId) => {
    await api.delete(`/chat/messages/${messageId}`);
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] || []).map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m,
        ),
      },
    }));
  },

  toggleReaction: async (messageId, conversationId, emoji) => {
    await api.post(`/chat/messages/${messageId}/reactions`, { emoji });
    // Re-fetch messages to get updated reactions
    await get().fetchMessages(conversationId);
  },

  fetchPinnedMessages: async (conversationId) => {
    const res = await api.get(`/chat/conversations/${conversationId}/pinned`);
    set((s) => ({
      pinnedMessages: {
        ...s.pinnedMessages,
        [conversationId]: res.data.data.map((p: { message: ChatMessage }) => p.message),
      },
    }));
  },

  pinMessage: async (conversationId, messageId) => {
    await api.post(`/chat/conversations/${conversationId}/pin/${messageId}`);
    await get().fetchPinnedMessages(conversationId);
  },

  unpinMessage: async (conversationId, messageId) => {
    await api.delete(`/chat/conversations/${conversationId}/pin/${messageId}`);
    set((s) => ({
      pinnedMessages: {
        ...s.pinnedMessages,
        [conversationId]: (s.pinnedMessages[conversationId] || []).filter(
          (m) => m.id !== messageId,
        ),
      },
    }));
  },

  searchMessages: async (query) => {
    const res = await api.get('/chat/search', { params: { q: query } });
    return res.data.data;
  },

  markRead: async (conversationId) => {
    await api.patch(`/chat/conversations/${conversationId}/read`);
    const { socket } = useSocketStore.getState();
    socket?.emit('chat_mark_read' as any, { conversationId });
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    }));
  },

  setPresence: (userId, status) => {
    set((s) => ({ presence: { ...s.presence, [userId]: status } }));
  },

  subscribeToSocket: () => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;

    // Incoming chat message
    socket.on('chat_message' as any, (payload: { conversationId?: string; message?: ChatMessage } | ChatMessage) => {
      // Support both direct message object and wrapped object
      const message = (payload as { message?: ChatMessage }).message ?? (payload as ChatMessage);
      const conversationId = message.conversationId;
      if (!conversationId) return;

      const isCurrentConv = get().activeConversationId === conversationId;
      const { user } = useAuthStore.getState();
      const isFromMe = message.senderId === user?.id;

      if (!isFromMe) {
        if (!isCurrentConv || document.hidden) {
          playNotificationSound();
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const conv = get().conversations.find((c) => c.id === conversationId);
            const title = conv?.type === 'DIRECT' ? 'New Message' : conv?.name || 'New Message';
            new Notification(title, {
              body: message.content || 'Sent an attachment',
              icon: '/favicon.ico',
            });
          }
        }
      }

      set((s) => ({
        messages: {
          ...s.messages,
          [conversationId]: [...(s.messages[conversationId] || []), message],
        },
        conversations: s.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: message,
                unreadCount: s.activeConversationId === conversationId ? 0 : c.unreadCount + 1,
              }
            : c,
        ),
      }));
    });

    // Message edited
    socket.on('chat_message_updated' as any, (message: ChatMessage) => {
      const conversationId = message.conversationId;
      set((s) => ({
        messages: {
          ...s.messages,
          [conversationId]: (s.messages[conversationId] || []).map((m) =>
            m.id === message.id ? message : m,
          ),
        },
      }));
    });

    // Message deleted
    socket.on('chat_message_deleted' as any, ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      set((s) => ({
        messages: {
          ...s.messages,
          [conversationId]: (s.messages[conversationId] || []).map((m) =>
            m.id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m,
          ),
        },
      }));
    });

    // Typing
    socket.on('chat_typing' as any, (payload: { userId: string; userName: string; conversationId: string; isTyping: boolean }) => {
      set((s) => {
        const without = s.typingUsers.filter(
          (t) => !(t.userId === payload.userId && t.conversationId === payload.conversationId),
        );
        return {
          typingUsers: payload.isTyping
            ? [...without, { userId: payload.userId, userName: payload.userName, conversationId: payload.conversationId }]
            : without,
        };
      });
    });

    // Read receipts
    socket.on('chat_read' as any, ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      // Could update read receipt UI here
    });

    // Presence
    socket.on('presence_update' as any, ({ userId, status }: { userId: string; status: PresenceStatus }) => {
      get().setPresence(userId, status);
    });
  },

  unsubscribeFromSocket: () => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;
    socket.off('chat_message' as any);
    socket.off('chat_message_updated' as any);
    socket.off('chat_message_deleted' as any);
    socket.off('chat_typing' as any);
    socket.off('chat_read' as any);
    socket.off('presence_update' as any);
  },
}));
