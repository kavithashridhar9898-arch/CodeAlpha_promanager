'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Loader2, Check, X } from 'lucide-react';
import type { Comment } from '@/hooks/useComments';
import { useUpdateComment, useDeleteComment } from '@/hooks/useComments';

interface Props {
  comment: Comment;
  taskId: string;
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

export function CommentCard({ comment, taskId, currentUserId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const { mutateAsync: updateComment, isPending: isSaving } = useUpdateComment(taskId);
  const { mutateAsync: deleteComment, isPending: isDeleting } = useDeleteComment(taskId);

  const isOwn = comment.author.id === currentUserId;
  const isEdited = comment.updatedAt !== comment.createdAt;

  const handleSave = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === comment.content) {
      setIsEditing(false);
      return;
    }
    await updateComment({ id: comment.id, content: trimmed });
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

  return (
    <div className="flex gap-3 group">
      {comment.author.avatarUrl ? (
        <img
          src={comment.author.avatarUrl}
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
          <div className="space-y-2 mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
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
