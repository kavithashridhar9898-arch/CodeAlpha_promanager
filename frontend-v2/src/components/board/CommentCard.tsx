'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Loader2, Check, X } from 'lucide-react';
import type { Comment } from '@/hooks/useComments';
import { useUpdateComment, useDeleteComment } from '@/hooks/useComments';
import { useProject } from '@/hooks/useProjects';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  comment: Comment;
  taskId: string;
  projectId: string;
  currentUserId: string;
}

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function CommentCard({ comment, taskId, projectId, currentUserId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [mentionQuery, setMentionQuery] = useState<{ query: string; index: number } | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const { data: project } = useProject(projectId);
  const { mutateAsync: updateComment, isPending: isSaving } = useUpdateComment(taskId);
  const { mutateAsync: deleteComment, isPending: isDeleting } = useDeleteComment(taskId);

  const isOwn = comment.author.id === currentUserId;
  const isEdited = comment.updatedAt !== comment.createdAt;

  const extractMentionedUserIds = (content: string) => {
    if (!project) return [];
    const ids: string[] = [];
    project.members.forEach((m) => {
      if (content.includes(`@${m.user.name}`)) {
        ids.push(m.user.id);
      }
    });
    return ids;
  };

  const handleSave = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === comment.content) {
      setIsEditing(false);
      return;
    }
    const mentionedUserIds = extractMentionedUserIds(trimmed);
    await updateComment({ id: comment.id, content: trimmed, mentionedUserIds });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    await deleteComment(comment.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditContent(comment.content);
      setIsEditing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
    const cursor = e.target.selectionStart;
    const textBeforeCursor = e.target.value.slice(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_\s]*)$/);
    if (match) {
      setMentionQuery({ query: match[1], index: match.index! });
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (userName: string) => {
    if (!mentionQuery) return;
    const before = editContent.slice(0, mentionQuery.index);
    const after = editContent.slice(textareaRef.current?.selectionStart || editContent.length);
    const newContent = `${before}@${userName} ${after}`;
    setEditContent(newContent);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex gap-3 group">
      {comment.author.avatarUrl ? (
        <img
          src={comment.author.avatarUrl.startsWith('http') ? comment.author.avatarUrl : `http://localhost:5000${comment.author.avatarUrl}`}
          alt={comment.author.name}
          className="w-8 h-8 rounded-full flex-shrink-0 border border-border"
        />
      ) : (
        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/30">
          {comment.author.name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">{comment.author.name}</span>
          <span className="text-[11px] text-muted-foreground">{formatTime(comment.createdAt)}</span>
          {isEdited && (
            <span className="text-[10px] text-muted-foreground/70 italic">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2 mt-2 relative">
            <AnimatePresence>
              {mentionQuery && project && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto"
                >
                  {project.members
                    .filter((m) => m.user.name.toLowerCase().includes(mentionQuery.query.toLowerCase()))
                    .map((m) => (
                      <button
                        key={m.user.id}
                        onClick={() => insertMention(m.user.name)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-secondary/50 text-left transition-colors"
                      >
                        {m.user.avatarUrl ? (
                          <img src={m.user.avatarUrl.startsWith('http') ? m.user.avatarUrl : `http://localhost:5000${m.user.avatarUrl}`} alt={m.user.name} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {m.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-foreground">{m.user.name}</span>
                      </button>
                    ))}
                  {project.members.filter((m) => m.user.name.toLowerCase().includes(mentionQuery.query.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-xs text-muted-foreground text-center">No users found</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setMentionQuery(null), 200)}
              autoFocus
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-secondary/30 border border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-foreground resize-none transition-all"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save
              </button>
              <button
                onClick={() => { setEditContent(comment.content); setIsEditing(false); }}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
              <span className="text-[10px] text-muted-foreground/50 ml-auto hidden sm:inline-block">Ctrl+Enter to save · Esc to cancel</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-1 bg-secondary/30 p-3 rounded-2xl rounded-tl-none border border-border/50 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}

        {isOwn && !isEditing && (
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => { setEditContent(comment.content); setIsEditing(true); }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive px-2 py-1 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
