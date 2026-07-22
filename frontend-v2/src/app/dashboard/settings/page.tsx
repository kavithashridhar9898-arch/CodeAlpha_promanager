'use client';

import React from 'react';
import { Bell, Shield, User, Key, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';


export default function SettingsPage() {
  const { user, updateMe } = useAuthStore();
  
  const [settings, setSettings] = useState({
    taskAssignments: true,
    mentions: true,
    projectActivity: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.notificationSettings) {
      setSettings({
        taskAssignments: user.notificationSettings.taskAssignments ?? true,
        mentions: user.notificationSettings.mentions ?? true,
        projectActivity: user.notificationSettings.projectActivity ?? true
      });
    }
  }, [user]);

  const handleSave = async () => {
    setMessage({ type: '', text: '' });
    try {
      setIsSaving(true);
      await updateMe({ notificationSettings: settings });
      setMessage({ type: 'success', text: 'Notification preferences saved successfully.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save preferences.' });
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="h-full max-w-5xl mx-auto flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and notification settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar Nav */}
        <div className="col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-secondary/80 text-foreground font-semibold rounded-2xl transition-colors border border-border">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 text-muted-foreground hover:text-foreground font-medium rounded-2xl transition-colors border border-transparent hover:border-border">
            <User className="w-5 h-5" />
            Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 text-muted-foreground hover:text-foreground font-medium rounded-2xl transition-colors border border-transparent hover:border-border">
            <Shield className="w-5 h-5" />
            Security
          </button>
        </div>

        {/* Content Area */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground">Choose what you want to be notified about.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-secondary/30 transition-colors border border-transparent hover:border-border/50">
                <div>
                  <h4 className="font-semibold text-foreground">Task Assignments</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">Notify me when I'm assigned or unassigned from a task.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.taskAssignments}
                    onChange={(e) => setSettings({ ...settings, taskAssignments: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-secondary/30 transition-colors border border-transparent hover:border-border/50">
                <div>
                  <h4 className="font-semibold text-foreground">Mentions</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">Notify me when someone @mentions me in a comment.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.mentions}
                    onChange={(e) => setSettings({ ...settings, mentions: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-secondary/30 transition-colors border border-transparent hover:border-border/50">
                <div>
                  <h4 className="font-semibold text-foreground">Project Activity</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">Notify me when I am added or removed from projects.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.projectActivity}
                    onChange={(e) => setSettings({ ...settings, projectActivity: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
                </label>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
              <div>
                {message.text && (
                  <span className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-500' : 'text-destructive'}`}>
                    {message.text}
                  </span>
                )}
              </div>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
