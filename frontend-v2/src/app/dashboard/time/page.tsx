'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Play } from 'lucide-react';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

export default function TimeTrackerPage() {
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data?.data && res.data.data.length > 0) {
        setProjects(res.data.data);
        setProjectId(res.data.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleStartTimer = async () => {
    if (!projectId) {
      alert('You need to have at least one project to start a timer.');
      return;
    }

    try {
      await api.post('/time/timer/start', {
        projectId,
        description: description || 'General Work'
      });
      setDescription('');
      // Timer widget will auto-fetch since we could trigger a global event, or let it poll.
      // But for simplicity, we just alert or refresh.
      window.location.reload(); 
    } catch (error) {
      console.error('Failed to start timer', error);
      alert('Could not start timer. Ensure no other timer is running.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Time Tracker</h1>
          <p className="text-muted-foreground mt-1">Track your hours directly or log them manually.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col md:flex-row items-center gap-4">
          <select 
            value={projectId} 
            onChange={e => setProjectId(e.target.value)}
            className="w-full md:w-auto bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary text-foreground"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input 
            type="text"
            placeholder="What are you working on?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary text-foreground"
          />
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={handleStartTimer}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Play className="w-4 h-4 fill-current" /> Start Timer
            </button>
          </div>
        </div>
        
        <div className="p-8 text-center text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No recent time entries for today.</p>
        </div>
      </div>
    </div>
  );
}
