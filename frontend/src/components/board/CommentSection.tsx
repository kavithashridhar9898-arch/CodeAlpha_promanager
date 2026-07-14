import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { useComments, useCreateComment } from '../../hooks/useComments';
import { CommentCard } from './CommentCard';
import { useAuthStore } from '../../store/authStore';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';

interface Props {
  taskId: string;
}

export const CommentSection: React.FC<Props> = ({ taskId }) => {
  const currentUser = useAuthStore((s) => s.user);
  const { data: comments, isLoading, isError } = useComments(taskId);
  const { mutateAsync: createComment, isPending: isSending } = useCreateComment(taskId);
  const { typingUsers, onStartTyping, onStopTyping } = useTypingIndicator(
    taskId,
    currentUser?.id ?? '',
  );

  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever comment list changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments?.length]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onStopTyping();
    await createComment({ content: trimmed });
    setDraft('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col min-h-0">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-indigo-400" />
        <h4 className="text-sm font-bold text-white uppercase tracking-wide">
          Comments &amp; Discussion
        </h4>
        {comments && comments.length > 0 && (
          <span className="ml-auto text-xs bg-slate-800 text-gray-400 px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      <div className="space-y-5 mb-4">
        {isLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          </div>
        )}

        {isError && (
          <p className="text-xs text-red-400 text-center py-4">
            Failed to load comments.
          </p>
        )}

        {!isLoading && !isError && comments?.length === 0 && (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No comments yet. Be the first!</p>
          </div>
        )}

        {comments?.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            taskId={taskId}
            currentUserId={currentUser?.id ?? ''}
          />
        ))}

        {/* Invisible sentinel for auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 mb-2 h-5">
          <span className="text-xs text-indigo-400 italic animate-pulse">
            {typingUsers.length === 1
              ? `${typingUsers[0].userName} is typing…`
              : `${typingUsers.map((u) => u.userName).join(', ')} are typing…`}
          </span>
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-slate-800 pt-4" />

      {/* Comment input */}
      <div className="flex gap-3 mt-3">
        {/* Current user avatar */}
        {currentUser ? (
          currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-slate-700 mt-0.5"
            />
          ) : (
            <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-700 mt-0.5">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )
        ) : null}

        <div className="flex-1 flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); onStartTyping(); }}
            onKeyDown={handleKeyDown}
            onBlur={onStopTyping}
            placeholder="Add a comment… (Ctrl+Enter to send)"
            rows={3}
            disabled={isSending}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm text-white placeholder-gray-600 outline-none transition-all resize-none disabled:opacity-60"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={isSending || !draft.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
