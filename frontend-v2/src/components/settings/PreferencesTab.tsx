'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/axios';
import { Loader2, Globe, Clock, Palette, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function PreferencesTab() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    timezone: user?.timezone || 'UTC',
    language: user?.language || 'en',
    theme: user?.theme || 'system',
    dateFormat: user?.dateFormat || 'MM/DD/YYYY',
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await api.put('/profile', formData);
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, ...response.data.data } : null,
      }));
      setMessage(t('settings.preferencesTab.success'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('settings.preferencesTab.failed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('settings.preferencesTab.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('settings.preferencesTab.description')}</p>
      </div>

      <div className="space-y-6 bg-secondary/20 p-6 rounded-3xl border border-border">
        {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl">{error}</div>}
        {message && <div className="p-3 text-sm text-emerald-500 bg-emerald-500/10 rounded-xl">{message}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> {t('settings.preferencesTab.language')}
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none"
            >
              <option value="en">English (US)</option>
              <option value="en-gb">English (UK)</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> {t('settings.preferencesTab.timezone')}
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Kolkata">India (IST)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" /> {t('settings.preferencesTab.theme')}
            </label>
            <select
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none"
            >
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> {t('settings.preferencesTab.dateFormat')}
            </label>
            <select
              name="dateFormat"
              value={formData.dateFormat}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} {t('settings.preferencesTab.save')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
