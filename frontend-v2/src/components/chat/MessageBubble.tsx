'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal, Edit2, Trash2, Pin, Reply, Forward,
  CheckCheck, FileText, Image as ImageIcon, Mic, Video
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ChatMessage, useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';

import { VoiceMessagePlayer } from './VoiceMessagePlayer';

// ─── Date divider ─────────────────────────────────────────────────────────────

export function DateDivider({ date }: { date: Date }) {
  const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMMM d, yyyy');
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest px-2">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ─── Reaction badge ───────────────────────────────────────────────────────────

function ReactionBadge({
  emoji, count, isOwn, onClick,
}: { emoji: string; count: number; isOwn: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all ${
        isOwn
          ? 'border-primary/50 bg-primary/10 text-primary'
          : 'border-border bg-secondary/50 text-foreground hover:border-primary/30'
      }`}
    >
      <span>{emoji}</span>
      <span className="font-medium">{count}</span>
    </button>
  );
}

// ─── Attachment preview ───────────────────────────────────────────────────────

function AttachmentPreview({ attachment }: { attachment: ChatMessage['attachments'][0] }) {
  const isImage = attachment.mimeType.startsWith('image/');
  const isAudio = attachment.mimeType.startsWith('audio/');
  const url = attachment.url.startsWith('http') ? attachment.url : `http://localhost:5000${attachment.url}`;

  if (isAudio) {
    return <div className="mt-2"><VoiceMessagePlayer url={url} /></div>;
  }

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2 rounded-lg overflow-hidden max-w-[280px]">
        <img src={url} alt={attachment.originalName} className="object-cover max-h-48 w-full hover:opacity-90 transition-opacity" />
      </a>
    );
  }

  return (
    <a
      href={url}
      download={attachment.originalName}
      className="flex items-center gap-2 mt-2 p-2.5 bg-secondary/50 border border-border rounded-lg hover:bg-secondary transition-colors max-w-[260px]"
    >
      <FileText className="w-4 h-4 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium truncate">{attachment.originalName}</p>
        <p className="text-[10px] text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
      </div>
    </a>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

interface Props {
  message: ChatMessage;
  prevMessage?: ChatMessage;
  onReply: (message: ChatMessage) => void;
  showAvatar?: boolean;
  senderName?: string;
  senderAvatar?: string;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function MessageBubble({
  message,
  prevMessage,
  onReply,
  showAvatar = true,
  senderName,
  senderAvatar,
}: Props) {
  const { user } = useAuthStore();
  const { toggleReaction, deleteMessage, editMessage, pinMessage } = useChatStore();
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');

  const isOwn = message.senderId === user?.id;
  const isSameSender = prevMessage?.senderId === message.senderId;
  const showDateDiv =
    !prevMessage ||
    format(new Date(message.createdAt), 'yyyy-MM-dd') !== format(new Date(prevMessage.createdAt), 'yyyy-MM-dd');

  // Group reactions by emoji
  const reactionGroups = message.reactions.reduce<Record<string, { count: number; isOwn: boolean }>>(
    (acc, r) => {
      acc[r.emoji] = acc[r.emoji] || { count: 0, isOwn: false };
      acc[r.emoji].count++;
      if (r.userId === user?.id) acc[r.emoji].isOwn = true;
      return acc;
    },
    {},
  );

  const handleEditSubmit = async () => {
    if (editText.trim() !== message.content) {
      await editMessage(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  if (message.isDeleted) {
    return (
      <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} px-4 py-1`}>
        <div className="w-8 h-8 shrink-0" />
        <div className="italic text-muted-foreground text-xs bg-secondary/40 px-3 py-2 rounded-xl">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <>
      {showDateDiv && <DateDivider date={new Date(message.createdAt)} />}

      <div
        className={`group flex gap-3 px-4 py-1 ${isOwn ? 'flex-row-reverse' : ''} hover:bg-secondary/20 rounded-lg transition-colors`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
      >
        {/* Avatar */}
        <div className="w-8 h-8 shrink-0">
          {showAvatar && !isSameSender ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden">
              {senderAvatar ? (
                <img src={senderAvatar.startsWith('http') ? senderAvatar : `http://localhost:5000${senderAvatar}`} alt={senderName} className="w-full h-full object-cover" />
              ) : (
                (senderName || 'U').charAt(0)
              )}
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name + time */}
          {showAvatar && !isSameSender && !isOwn && (
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[12px] font-semibold text-foreground">{senderName}</span>
              <span className="text-[10px] text-muted-foreground">{format(new Date(message.createdAt), 'h:mm a')}</span>
            </div>
          )}

          {/* Bubble */}
          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-secondary/60 border border-border text-foreground rounded-tl-sm'
          }`}>
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="bg-transparent resize-none outline-none text-sm min-w-[200px]"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2 text-xs">
                  <button onClick={handleEditSubmit} className="text-primary-foreground/80 hover:text-primary-foreground font-medium">Save</button>
                  <button onClick={() => setIsEditing(false)} className="text-primary-foreground/60 hover:text-primary-foreground/80">Cancel</button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {/* Attachments */}
            {message.attachments.map((a) => <AttachmentPreview key={a.id} attachment={a} />)}

            {/* Edit label */}
            {message.isEdited && (
              <span className={`text-[10px] ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'} ml-1`}>(edited)</span>
            )}
          </div>

          {/* Reactions */}
          {Object.keys(reactionGroups).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(reactionGroups).map(([emoji, { count, isOwn: isMine }]) => (
                <ReactionBadge
                  key={emoji}
                  emoji={emoji}
                  count={count}
                  isOwn={isMine}
                  onClick={() => toggleReaction(message.id, message.conversationId, emoji)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Hover action bar */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex items-center gap-0.5 self-start mt-1 bg-card border border-border rounded-xl shadow-lg px-1 py-0.5 ${isOwn ? 'mr-2' : 'ml-2'}`}
            >
              {/* Quick emoji */}
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(message.id, message.conversationId, emoji)}
                  className="w-7 h-7 flex items-center justify-center text-sm hover:bg-secondary rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
              <div className="w-px h-4 bg-border mx-0.5" />
              <button
                onClick={() => onReply(message)}
                className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                title="Reply"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
              {isOwn && (
                <>
                  <button
                    onClick={() => { setIsEditing(true); setEditText(message.content || ''); }}
                    className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMessage(message.id, message.conversationId)}
                    className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => pinMessage(message.conversationId, message.id)}
                className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                title="Pin"
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
