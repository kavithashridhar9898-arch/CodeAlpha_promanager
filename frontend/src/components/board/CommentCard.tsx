import React, { useState } from 'react';
import { Pencil, Trash2, Loader2, Check, X } from 'lucide-react';
import type { Comment } from '../../hooks/useComments';
import { useUpdateComment, useDeleteComment } from '../../hooks/useComments';

interface Props {
  comment: Comment;
  taskId: string;
  currentUserId: string;
}

function Avatar({ author }: { author: Comment['author'] }) {
  if (author.avatarUrl) {
    return (
      <img
        src={author.avatarUrl}
        alt={author.name}
        className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-slate-700"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-700">
      {author.name.charAt(0).toUpperCase()}
    </div>
  );
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

export const CommentCard: React.FC<Props> = ({ comment, taskId, currentUserId }) => {
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
      <Avatar author={comment.author} />

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white">{comment.author.name}</span>
          <span className="text-[11px] text-gray-500">{formatTime(comment.createdAt)}</span>
          {isEdited && (
            <span className="text-[10px] text-gray-600 italic">(edited)</span>
          )}
        </div>

        {/* Body */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-indigo-500 focus:outline-none text-sm text-white resize-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save
              </button>
              <button
                onClick={() => { setEditContent(comment.content); setIsEditing(false); }}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-gray-400 hover:bg-slate-700 transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
              <span className="text-[10px] text-gray-600 ml-auto">Ctrl+Enter to save · Esc to cancel</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}

        {/* Actions — own comments only, hidden until hover */}
        {isOwn && !isEditing && (
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => { setEditContent(comment.content); setIsEditing(true); }}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-500/10 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
