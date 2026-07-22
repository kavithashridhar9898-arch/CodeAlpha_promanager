'use client';

import React, { useEffect } from 'react';
import { Pin, Users, FileText, X, Download, ExternalLink } from 'lucide-react';
import { useChatStore, PresenceStatus } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';

interface UserInfo {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

const STATUS_COLORS: Record<PresenceStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
};

function PresenceDot({ status }: { status: PresenceStatus }) {
  return (
    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${STATUS_COLORS[status]}`} />
  );
}

interface Props {
  conversationId: string;
  members: UserInfo[];
}

export function ParticipantsPanel({ conversationId, members }: Props) {
  const { pinnedMessages, fetchPinnedMessages, unpinMessage, presence } = useChatStore();
  const { user } = useAuthStore();

  const pinned = pinnedMessages[conversationId] || [];

  useEffect(() => {
    fetchPinnedMessages(conversationId);
  }, [conversationId]);

  return (
    <div className="flex flex-col h-full border-l border-border bg-card/30 w-72 shrink-0">
      {/* Members */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Members ({members.length})</span>
        </div>
        <div className="space-y-2">
          {members.map((member) => {
            const status: PresenceStatus = presence[member.id] || 'offline';
            return (
              <div key={member.id} className="flex items-center gap-2.5">
                <div className="relative w-7 h-7 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl.startsWith('http') ? member.avatarUrl : `http://localhost:5000${member.avatarUrl}`}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      member.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <PresenceDot status={status} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-foreground">
                    {member.id === user?.id ? `${member.name} (You)` : member.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize">{status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pinned messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-3">
          <Pin className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Pinned ({pinned.length})
          </span>
        </div>

        {pinned.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No pinned messages</p>
        ) : (
          <div className="space-y-2">
            {pinned.map((msg) => (
              <div
                key={msg.id}
                className="bg-secondary/40 border border-border rounded-xl p-3 group hover:bg-secondary/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-foreground line-clamp-3 break-words leading-relaxed">
                    {msg.content || '📎 Attachment'}
                  </p>
                  <button
                    onClick={() => unpinMessage(conversationId, msg.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    title="Unpin"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* File attachments in pinned */}
                {msg.attachments?.map((a) => (
                  <a
                    key={a.id}
                    href={a.url.startsWith('http') ? a.url : `http://localhost:5000${a.url}`}
                    download={a.originalName}
                    className="flex items-center gap-1.5 mt-1.5 text-[10px] text-primary hover:underline"
                  >
                    <FileText className="w-3 h-3" />
                    {a.originalName}
                  </a>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
