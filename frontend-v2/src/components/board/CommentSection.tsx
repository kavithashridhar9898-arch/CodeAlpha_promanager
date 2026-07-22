'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { useComments, useCreateComment } from '@/hooks/useComments';
import { CommentCard } from './CommentCard';
import { useAuthStore } from '@/store/authStore';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  taskId: string;
}

export function CommentSection({ taskId }: Props) {
  const currentUser = useAuthStore((s) => s.user);
  const { data: comments, isLoading, isError } = useComments(taskId);
  const { mutateAsync: createComment, isPending: isSending } = useCreateComment(taskId);
  const { typingUsers, onStartTyping, onStopTyping } = useTypingIndicator(taskId, currentUser?.id ?? '');

  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Comments
        </h3>
        {comments && comments.length > 0 && (
          <span className="ml-2 text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </div>

      <div className="space-y-6 mb-6">
        {isLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <p className="text-xs text-destructive text-center py-4">Failed to load comments.</p>
        )}

        {!isLoading && !isError && comments?.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No comments yet. Start the conversation!</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {comments?.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CommentCard
                comment={comment}
                taskId={taskId}
                currentUserId={currentUser?.id ?? ''}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 mb-3 h-5">
          <span className="text-xs text-primary italic animate-pulse">
            {typingUsers.length === 1
              ? `${typingUsers[0].userName} is typing…`
              : `${typingUsers.map((u) => u.userName).join(', ')} are typing…`}
          </span>
          <span className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      )}

      <div className="flex gap-3">
        {currentUser && (
          <div className="flex-shrink-0 mt-1">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 rounded-full border border-border" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary border border-primary/30">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); onStartTyping(); }}
            onKeyDown={handleKeyDown}
            onBlur={onStopTyping}
            placeholder="Write a comment... (Ctrl+Enter to send)"
            rows={2}
            disabled={isSending}
            className="w-full pl-4 pr-12 py-3 rounded-2xl bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-foreground outline-none transition-all resize-none disabled:opacity-60 placeholder:text-muted-foreground/60"
          />
          <button
            onClick={handleSend}
            disabled={isSending || !draft.trim()}
            className="absolute right-2 top-2 h-8 w-8 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 shadow-sm"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
