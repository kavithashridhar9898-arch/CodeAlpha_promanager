'use client';

import React from 'react';
import { Bell, Shield, User, Key, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';

import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { SecurityTab } from '@/components/settings/SecurityTab';
import { PreferencesTab } from '@/components/settings/PreferencesTab';
import { LabelsTab } from '@/components/settings/LabelsTab';
import { AuditLogTab } from '@/components/settings/AuditLogTab';
import { Settings2, Tag, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'profile' | 'security' | 'preferences' | 'labels' | 'audit'>('notifications');
  return (
    <div className="h-full max-w-5xl mx-auto flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and notification settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar Nav */}
        <div className="col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-2xl transition-colors border ${
              activeTab === 'notifications' 
                ? 'bg-secondary/80 text-foreground border-border' 
                : 'hover:bg-secondary/40 text-muted-foreground hover:text-foreground border-transparent hover:border-border'
            }`}
          >
            <Bell className={`w-5 h-5 ${activeTab === 'notifications' ? 'text-primary' : ''}`} />
            Notifications
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-2xl transition-colors border ${
              activeTab === 'profile' 
                ? 'bg-secondary/80 text-foreground border-border' 
                : 'hover:bg-secondary/40 text-muted-foreground hover:text-foreground border-transparent hover:border-border'
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-primary' : ''}`} />
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-2xl transition-colors border ${
              activeTab === 'security' 
                ? 'bg-secondary/80 text-foreground border-border' 
                : 'hover:bg-secondary/40 text-muted-foreground hover:text-foreground border-transparent hover:border-border'
            }`}
          >
            <Shield className={`w-5 h-5 ${activeTab === 'security' ? 'text-primary' : ''}`} />
            Security
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-2xl transition-colors border ${
              activeTab === 'preferences' 
                ? 'bg-secondary/80 text-foreground border-border' 
                : 'hover:bg-secondary/40 text-muted-foreground hover:text-foreground border-transparent hover:border-border'
            }`}
          >
            <Settings2 className={`w-5 h-5 ${activeTab === 'preferences' ? 'text-primary' : ''}`} />
            Preferences
          </button>
          <button 
            onClick={() => setActiveTab('labels')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-2xl transition-colors border ${
              activeTab === 'labels' 
                ? 'bg-secondary/80 text-foreground border-border' 
                : 'hover:bg-secondary/40 text-muted-foreground hover:text-foreground border-transparent hover:border-border'
            }`}
          >
            <Tag className={`w-5 h-5 ${activeTab === 'labels' ? 'text-primary' : ''}`} />
            Labels
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-2xl transition-colors border ${
              activeTab === 'audit' 
                ? 'bg-secondary/80 text-foreground border-border' 
                : 'hover:bg-secondary/40 text-muted-foreground hover:text-foreground border-transparent hover:border-border'
            }`}
          >
            <ShieldAlert className={`w-5 h-5 ${activeTab === 'audit' ? 'text-primary' : ''}`} />
            Audit Log
          </button>
        </div>

        {/* Content Area */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
          {activeTab === 'labels' && <LabelsTab />}
          {activeTab === 'audit' && <AuditLogTab />}
        </div>
      </div>
    </div>
  );
}
