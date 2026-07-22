'use client';

import React from 'react';
import { Video, Calendar, Users, Link2, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  hostId: string;
  joinLink: string;
  startTime: string;
  isInstant: boolean;
  isActive: boolean;
  participants: Array<{ userId: string }>;
}

interface Props {
  meeting: Meeting;
  onDeleted?: (id: string) => void;
}

export function MeetingCard({ meeting, onDeleted }: Props) {
  const { user } = useAuthStore();
  const isHost = meeting.hostId === user?.id;

  const handleDelete = async () => {
    if (!confirm('Cancel this meeting?')) return;
    try {
      await api.delete(`/meetings/${meeting.id}`);
      onDeleted?.(meeting.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            meeting.isActive ? 'bg-green-500/15 text-green-500' : 'bg-primary/10 text-primary'
          }`}>
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">{meeting.title}</h3>
            {meeting.isActive && (
              <span className="flex items-center gap-1 text-[11px] text-green-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Now
              </span>
            )}
          </div>
        </div>
        {isHost && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1.5 rounded-lg hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {meeting.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{meeting.description}</p>
      )}

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {format(new Date(meeting.startTime), 'MMM d, h:mm a')}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex gap-2">
        <a
          href={meeting.joinLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-xs font-medium"
        >
          <Video className="w-3.5 h-3.5" />
          Join Meeting
        </a>
        <button
          onClick={() => navigator.clipboard.writeText(meeting.joinLink)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border rounded-xl hover:bg-secondary/50 transition-colors text-xs text-muted-foreground"
          title="Copy link"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
