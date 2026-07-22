'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Smile, Paperclip, Mic, Send, Loader2, X, FileText } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useSocketStore } from '@/store/socketStore';
import { useAuthStore } from '@/store/authStore';

interface Props {
  conversationId: string;
  onFocus?: () => void;
  replyToMessage?: { id: string; content: string | null; senderName?: string } | null;
  onCancelReply?: () => void;
}

export function MessageInput({ conversationId, onFocus, replyToMessage, onCancelReply }: Props) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { sendMessage, isSending } = useChatStore();
  const { socket } = useSocketStore();

  const handleTyping = () => {
    socket?.emit('chat_typing_start' as any, { conversationId });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket?.emit('chat_typing_stop' as any, { conversationId });
    }, 2000);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && files.length === 0) || isSending) return;

    socket?.emit('chat_typing_stop' as any, { conversationId });

    await sendMessage(conversationId, {
      content: text.trim() || undefined,
      replyToId: replyToMessage?.id,
      files: files.length > 0 ? files : undefined,
    });

    setText('');
    setFiles([]);
    onCancelReply?.();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
        setFiles((prev) => [...prev, audioFile]);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone', error);
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = []; // clear chunks so we don't save it
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  return (
    <div
      className={`border-t border-border p-4 transition-colors ${isDragging ? 'bg-primary/5' : 'bg-background'}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Reply indicator */}
      {replyToMessage && (
        <div className="mb-2 flex items-start gap-2 pl-3 border-l-2 border-primary py-1">
          <div className="flex-1">
            <p className="text-[11px] font-medium text-primary">
              {replyToMessage.senderName ? `Replying to ${replyToMessage.senderName}` : 'Replying'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {replyToMessage.content || '📎 Attachment'}
            </p>
          </div>
          <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-secondary/60 border border-border rounded-lg px-3 py-1.5 text-xs"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span className="truncate max-w-[120px]">{file.name}</span>
              <button onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input area */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Left actions */}
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.mp3,.wav,.webm"
          />
        </div>

        {/* Textarea or Recording indicator */}
        <div className="flex-1 relative flex items-center">
          {isRecording ? (
            <div className="flex-1 flex items-center justify-between bg-primary/10 border border-primary rounded-xl px-4 py-2.5 text-sm">
              <div className="flex items-center gap-2 text-primary font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Recording: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={cancelRecording} className="text-muted-foreground hover:text-destructive text-xs font-medium px-2 py-1">Cancel</button>
                <button type="button" onClick={stopRecording} className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs font-medium">Done</button>
              </div>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => { setText(e.target.value); handleTyping(); }}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
              rows={1}
              style={{ resize: 'none' }}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all max-h-32 overflow-y-auto"
            />
          )}
        </div>

        {/* Voice or Send button */}
        {!text.trim() && files.length === 0 && !isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="shrink-0 p-2.5 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-all"
          >
            <Mic className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={(!text.trim() && files.length === 0) || isSending || isRecording}
            className="shrink-0 p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        )}
      </form>

      {/* Drag hint */}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-xl pointer-events-none">
          <p className="text-primary font-medium">Drop files to attach</p>
        </div>
      )}
    </div>
  );
}
