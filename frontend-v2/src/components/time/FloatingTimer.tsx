import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Clock, X } from 'lucide-react';
import { api } from '@/lib/axios';

export function FloatingTimer() {
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchActiveTimer();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer) {
      interval = setInterval(() => {
        const start = new Date(activeTimer.startTime).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const fetchActiveTimer = async () => {
    try {
      const res = await api.get('/time/timer/active');
      if (res.data) {
        setActiveTimer(res.data);
      } else {
        setActiveTimer(null);
      }
    } catch (error) {
      console.error('Failed to fetch active timer', error);
    }
  };

  const handleStop = async () => {
    try {
      await api.post('/time/timer/stop');
      setActiveTimer(null);
      setIsOpen(false);
      // In a real app, you might trigger a toast notification here
    } catch (error) {
      console.error('Failed to stop timer', error);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  if (!activeTimer) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden w-72 mb-4"
          >
            <div className="p-4 bg-primary/10 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary animate-pulse" />
                <span className="font-semibold text-sm">Active Timer</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 text-center">
              <div className="text-4xl font-mono font-bold tracking-tight mb-2 text-foreground">
                {formatTime(elapsed)}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 mb-4">
                {activeTimer.description || 'Tracking Time...'}
              </p>
              
              <button
                onClick={handleStop}
                className="w-full flex items-center justify-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2 px-4 rounded-lg font-medium transition-colors"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop Timer
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all border border-primary/20"
          >
            <div className="relative">
              <Clock className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full animate-ping" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full" />
            </div>
            <span className="font-mono font-bold">{formatTime(elapsed)}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
