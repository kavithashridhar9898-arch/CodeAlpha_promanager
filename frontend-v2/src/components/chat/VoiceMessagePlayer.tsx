'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface Props {
  url: string;
}

export function VoiceMessagePlayer({ url }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const resolvedUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;

  useEffect(() => {
    const audio = new Audio(resolvedUrl);
    audioRef.current = audio;

    const handleTimeUpdate = () => setProgress((audio.currentTime / audio.duration) * 100);
    const handleLoadedMetadata = () => {
      if (audio.duration !== Infinity) setDuration(audio.duration);
    };
    const handleEnded = () => { setIsPlaying(false); setProgress(0); };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [resolvedUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    audioRef.current.currentTime = percent * duration;
    setProgress(percent * 100);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs === Infinity) return '0:00';
    return `${Math.floor(secs / 60)}:${Math.floor(secs % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-secondary/80 rounded-full px-3 py-2 min-w-[200px]">
      <button
        onClick={togglePlay}
        className="w-8 h-8 flex shrink-0 items-center justify-center bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
      </button>

      <div className="flex-1">
        {/* Simple progress bar */}
        <div 
          className="h-1.5 bg-border rounded-full w-full cursor-pointer relative overflow-hidden group"
          onClick={handleSeek}
        >
          <div 
            className="absolute left-0 top-0 h-full bg-primary transition-all group-hover:bg-primary/80" 
            style={{ width: `${progress || 0}%` }} 
          />
        </div>
        <div className="flex justify-between mt-1 px-0.5">
          <span className="text-[10px] text-muted-foreground font-medium">
            {formatTime(audioRef.current?.currentTime || 0)}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
