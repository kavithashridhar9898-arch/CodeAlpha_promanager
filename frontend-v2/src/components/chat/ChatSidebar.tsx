'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Plus, Search, Hash, Users, Briefcase,
  Globe, ChevronDown, ChevronRight, Video, MoreHorizontal,
} from 'lucide-react';
import { useChatStore, Conversation, ConversationType } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getConvIcon(type: ConversationType) {
  switch (type) {
    case 'WORKSPACE': return Globe;
    case 'TEAM': return Users;
    case 'PROJECT': return Briefcase;
    case 'GROUP': return Hash;
    default: return MessageSquare;
  }
}

function ConvItem({ conv, isActive, onClick }: { conv: Conversation; isActive: boolean; onClick: () => void }) {
  const Icon = getConvIcon(conv.type);
  const { user } = useAuthStore();

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
        isActive
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
      }`}
    >
      {/* Icon / Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
        isActive ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
      }`}>
        {conv.type === 'DIRECT'
          ? (conv.name || '?').charAt(0).toUpperCase()
          : <Icon className="w-4 h-4" />
        }
      </div>

      {/* Name + last message */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between">
          <span className={`font-medium truncate text-[13px] ${isActive ? 'text-primary' : ''}`}>
            {conv.name || 'Direct Message'}
          </span>
          {conv.lastMessage && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {format(new Date(conv.lastMessage.createdAt), 'h:mm a')}
            </span>
          )}
        </div>
        {conv.lastMessage && !conv.lastMessage.isDeleted && (
          <p className="text-[11px] text-muted-foreground truncate">
            {conv.lastMessage.content || '📎 Attachment'}
          </p>
        )}
      </div>

      {/* Unread badge */}
      {conv.unreadCount > 0 && (
        <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
        </span>
      )}
    </button>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface Props {
  onNewConversation: () => void;
  onNewMeeting: () => void;
}

export function ChatSidebar({ onNewConversation, onNewMeeting }: Props) {
  const { conversations, activeConversationId, setActiveConversation, fetchMessages } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    channels: true,
    dms: true,
  });

  const filtered = conversations.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const channels = filtered.filter((c) => ['WORKSPACE', 'TEAM', 'PROJECT', 'GROUP'].includes(c.type));
  const dms = filtered.filter((c) => c.type === 'DIRECT');

  const toggleSection = (key: string) =>
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }));

  const handleSelect = (conv: Conversation) => {
    setActiveConversation(conv.id);
    fetchMessages(conv.id);
  };

  return (
    <div className="flex flex-col h-full bg-card/40 border-r border-border">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <span className="font-semibold text-sm">Messages</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewMeeting}
            title="Start meeting"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            onClick={onNewConversation}
            title="New conversation"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg border border-border">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
        {/* Channels */}
        <div>
          <button
            onClick={() => toggleSection('channels')}
            className="w-full flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
          >
            {expandedSections.channels ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Channels
          </button>
          <AnimatePresence>
            {expandedSections.channels && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {channels.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground px-3 py-2">No channels yet</p>
                ) : (
                  channels.map((c) => (
                    <ConvItem
                      key={c.id}
                      conv={c}
                      isActive={activeConversationId === c.id}
                      onClick={() => handleSelect(c)}
                    />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Direct Messages */}
        <div>
          <button
            onClick={() => toggleSection('dms')}
            className="w-full flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
          >
            {expandedSections.dms ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Direct Messages
          </button>
          <AnimatePresence>
            {expandedSections.dms && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {dms.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground px-3 py-2">No direct messages yet</p>
                ) : (
                  dms.map((c) => (
                    <ConvItem
                      key={c.id}
                      conv={c}
                      isActive={activeConversationId === c.id}
                      onClick={() => handleSelect(c)}
                    />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
