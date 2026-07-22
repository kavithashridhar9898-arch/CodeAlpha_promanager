'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useSocketStore } from '@/store/socketStore';
import { useAuthStore } from '@/store/authStore';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ParticipantsPanel } from '@/components/chat/ParticipantsPanel';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';
import { NewConversationModal } from '@/components/chat/NewConversationModal';
import { api } from '@/lib/axios';

interface UserInfo {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export default function ChatPage() {
  const { conversations, activeConversationId, setActiveConversation, fetchConversations, subscribeToSocket } = useChatStore();
  const { socket, connect } = useSocketStore();
  const { user } = useAuthStore();

  const [isNewConvOpen, setIsNewConvOpen] = useState(false);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  const [memberDetails, setMemberDetails] = useState<Record<string, UserInfo>>({});

  // Connect socket + fetch conversations on mount
  useEffect(() => {
    connect();
    fetchConversations();
  }, []);

  // Subscribe to socket events
  useEffect(() => {
    if (socket) subscribeToSocket();
    return () => {
      // cleanup handled in store
    };
  }, [socket]);

  // Fetch member details for active conversation
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  useEffect(() => {
    if (!activeConversation) return;
    const memberIds = activeConversation.members.map((m) => m.userId).filter((id) => !memberDetails[id]);
    if (memberIds.length === 0) return;

    Promise.all(
      memberIds.map((id) =>
        api.get(`/auth/users/${id}`).then((r) => r.data.data).catch(() => null),
      ),
    ).then((users) => {
      const newMap: Record<string, UserInfo> = {};
      users.forEach((u, i) => { if (u) newMap[memberIds[i]] = u; });
      setMemberDetails((prev) => ({ ...prev, ...newMap }));
    });
  }, [activeConversationId, activeConversation?.members.length]);

  const activeMembers = activeConversation?.members
    .map((m) => memberDetails[m.userId])
    .filter(Boolean) as UserInfo[] || [];

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 md:-m-8 overflow-hidden">
      {/* Left: Conversation Sidebar */}
      <div className="w-72 hidden md:flex flex-col shrink-0">
        <ChatSidebar
          onNewConversation={() => setIsNewConvOpen(true)}
          onNewMeeting={() => setIsMeetingOpen(true)}
        />
      </div>

      {/* Center: Chat Window */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConversationId ? (
          <ChatWindow conversationId={activeConversationId} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center max-w-sm px-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                ProManager Hub
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Your team collaboration space. Select a conversation or start a new one.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setIsNewConvOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <MessageSquare className="w-4 h-4" />
                  New Message
                </button>
                <button
                  onClick={() => setIsMeetingOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl hover:bg-secondary/50 transition-colors text-sm font-medium text-muted-foreground"
                >
                  <Sparkles className="w-4 h-4" />
                  Start Meeting
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Right: Participants Panel */}
      {activeConversationId && activeMembers.length > 0 && (
        <ParticipantsPanel
          conversationId={activeConversationId}
          members={activeMembers}
        />
      )}

      {/* Modals */}
      <NewConversationModal
        isOpen={isNewConvOpen}
        onClose={() => setIsNewConvOpen(false)}
        onCreated={(id) => {
          setActiveConversation(id);
          setIsNewConvOpen(false);
        }}
      />
      <CreateMeetingModal isOpen={isMeetingOpen} onClose={() => setIsMeetingOpen(false)} />
    </div>
  );
}
