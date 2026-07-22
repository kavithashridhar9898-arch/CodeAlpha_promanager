'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, MessageSquare, Search, X, Pin } from 'lucide-react';
import { useChatStore, ChatMessage } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/axios';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { WhiteboardModal } from './WhiteboardModal';
import { PenTool } from 'lucide-react';

interface UserInfo {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface Props {
  conversationId: string;
}

export function ChatWindow({ conversationId }: Props) {
  const { messages, fetchMessages, hasMoreMessages, isLoading, conversations, typingUsers, markRead } = useChatStore();
  const { user } = useAuthStore();
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, UserInfo>>({});
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const conversation = conversations.find((c) => c.id === conversationId);
  const convMessages = (messages[conversationId] || []).filter(
    (m) => !searchQuery || (m.content || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const typingInConv = typingUsers.filter((t) => t.conversationId === conversationId);

  // Load messages on mount
  useEffect(() => {
    isInitialLoad.current = true;
    fetchMessages(conversationId).then(() => {
      isInitialLoad.current = false;
    });
    markRead(conversationId);
  }, [conversationId]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (isInitialLoad.current || !endRef.current) return;
    endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!isLoading && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [isLoading]);

  // Fetch user info for messages
  useEffect(() => {
    const senderIds = [...new Set(convMessages.map((m) => m.senderId))];
    const missing = senderIds.filter((id) => !userMap[id]);
    if (missing.length === 0) return;

    Promise.all(
      missing.map((id) =>
        api.get(`/auth/users/${id}`).then((r) => r.data.data).catch(() => null),
      ),
    ).then((users) => {
      const newMap: Record<string, UserInfo> = {};
      users.forEach((u, i) => { if (u) newMap[missing[i]] = u; });
      setUserMap((prev) => ({ ...prev, ...newMap }));
    });
  }, [convMessages.length]);

  // Infinite scroll to load older messages
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !hasMoreMessages[conversationId] || isLoading) return;
    if (container.scrollTop < 100) {
      const oldest = convMessages[0];
      if (oldest) fetchMessages(conversationId, oldest.id);
    }
  }, [conversationId, hasMoreMessages, isLoading, convMessages]);

  useEffect(() => {
    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Conversation not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {(conversation.name || 'D').charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{conversation.name || 'Direct Message'}</h3>
            <p className="text-[11px] text-muted-foreground">
              {conversation.members.length} members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWhiteboardOpen(true)}
            title="Open Whiteboard"
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <PenTool className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {isSearchOpen && (
        <div className="border-b border-border px-4 py-2 flex items-center gap-2 bg-secondary/30">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in this conversation..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto py-4 space-y-0.5">
        {isLoading && convMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : convMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <MessageSquare className="w-12 h-12 text-primary/30 mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Start the conversation!</h3>
            <p className="text-sm text-muted-foreground">
              Say hello to {conversation.name || 'your teammate'} 👋
            </p>
          </div>
        ) : (
          <>
            {hasMoreMessages[conversationId] && (
              <div className="flex justify-center py-2">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : null}
              </div>
            )}
            {convMessages.map((msg, idx) => {
              const sender = userMap[msg.senderId];
              const prevMsg = convMessages[idx - 1];
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  prevMessage={prevMsg}
                  onReply={setReplyTo}
                  senderName={msg.senderId === user?.id ? 'You' : sender?.name || 'User'}
                  senderAvatar={sender?.avatarUrl || undefined}
                />
              );
            })}

            {/* Typing indicators */}
            {typingInConv.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-1">
                <div className="w-8 h-8" />
                <div className="bg-secondary/60 border border-border rounded-2xl rounded-tl-sm px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                    <span className="text-[11px] text-muted-foreground ml-1">
                      {typingInConv.map((t) => t.userName).join(', ')} typing...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversationId}
        replyToMessage={replyTo ? {
          id: replyTo.id,
          content: replyTo.content,
          senderName: userMap[replyTo.senderId]?.name,
        } : null}
        onCancelReply={() => setReplyTo(null)}
      />

      {/* Whiteboard */}
      <WhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
        conversationId={conversationId}
      />
    </div>
  );
}
