'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, Calendar, Link2, Clock, Users } from 'lucide-react';
import { api } from '@/lib/axios';
import { format } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateMeetingModal({ isOpen, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [isInstant, setIsInstant] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState<{ title: string; joinLink: string } | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/meetings', {
        title: title.trim(),
        description: description.trim() || undefined,
        isInstant,
        startTime: isInstant ? undefined : startTime,
      });
      setCreatedMeeting(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (createdMeeting) navigator.clipboard.writeText(createdMeeting.joinLink);
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setIsInstant(true);
    setStartTime('');
    setCreatedMeeting(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Video className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold">
                    {createdMeeting ? 'Meeting Ready!' : 'Create Meeting'}
                  </h2>
                </div>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createdMeeting ? (
                /* Success state */
                <div className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Your meeting <strong>{createdMeeting.title}</strong> is ready. Share the link to invite participants.
                  </p>
                  <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl p-3">
                    <Link2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs text-foreground flex-1 truncate">{createdMeeting.joinLink}</span>
                    <button
                      onClick={handleCopy}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                  <a
                    href={createdMeeting.joinLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium text-sm"
                  >
                    <Video className="w-4 h-4" />
                    Join Meeting Now
                  </a>
                </div>
              ) : (
                /* Form state */
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Meeting Title *</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Weekly Standup"
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description (optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this meeting about?"
                      rows={2}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsInstant(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                        isInstant ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      Start Now
                    </button>
                    <button
                      onClick={() => setIsInstant(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                        !isInstant ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule
                    </button>
                  </div>

                  {!isInstant && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start Time</label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleCreate}
                    disabled={isSubmitting || !title.trim()}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
                  >
                    {isSubmitting ? 'Creating...' : isInstant ? 'Start Meeting' : 'Schedule Meeting'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
