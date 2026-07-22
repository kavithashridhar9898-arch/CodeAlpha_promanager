import React, { useState, useRef, ChangeEvent } from 'react';
import { User, Save, Upload, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/axios';
import { useTranslation } from 'react-i18next';

export function ProfileTab() {
  const { user, updateMe } = useAuthStore();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    phone: user?.phone || '',
    jobTitle: user?.jobTitle || '',
    bio: user?.bio || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges = 
    formData.name !== (user?.name || '') ||
    formData.username !== (user?.username || '') ||
    formData.phone !== (user?.phone || '') ||
    formData.jobTitle !== (user?.jobTitle || '') ||
    formData.bio !== (user?.bio || '') ||
    avatarFile !== null;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image must be less than 5MB.' });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setMessage({ type: '', text: '' });
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsUploading(true);
      await api.delete('/profile/avatar');
      useAuthStore.setState((state) => ({ user: state.user ? { ...state.user, avatarUrl: undefined } : null }));
      setAvatarFile(null);
      setAvatarPreview(null);
      setMessage({ type: 'success', text: 'Profile photo removed.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to remove photo.' });
    } finally {
      setIsUploading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleSave = async () => {
    setMessage({ type: '', text: '' });
    try {
      setIsSaving(true);
      
      // Upload Avatar first if changed
      let newAvatarUrl = user?.avatarUrl;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const { data } = await api.post('/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        newAvatarUrl = data.data.avatarUrl;
        useAuthStore.setState((state) => ({ user: state.user ? { ...state.user, avatarUrl: newAvatarUrl } : null }));
        setAvatarFile(null);
      }

      // Update Profile
      const { data: profileData } = await api.put('/profile', formData);
      useAuthStore.setState({ user: profileData.data });
      
      setMessage({ type: 'success', text: t('settings.profileTab.success') });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || t('settings.profileTab.failed') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-8"
    >
      <div className="flex items-center gap-3 pb-6 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('settings.profileTab.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('settings.profileTab.description')}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-border">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-secondary border-4 border-card shadow-lg flex items-center justify-center text-4xl font-bold text-primary">
            {avatarPreview ? (
              <img src={avatarPreview.startsWith('blob') ? avatarPreview : `http://localhost:5000${avatarPreview}`} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Upload</span>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/png, image/jpeg, image/webp" 
            className="hidden" 
          />
        </div>
        <div className="flex flex-col gap-3 text-center sm:text-left">
          <div>
            <h3 className="font-semibold text-foreground">Profile Picture</h3>
            <p className="text-sm text-muted-foreground">JPG, PNG or WEBP. Max size 5MB.</p>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-3 mt-1">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold rounded-xl transition-colors border border-border"
            >
              {t('settings.profileTab.uploadPhoto')}
            </button>
            {(avatarPreview || user?.avatarUrl) && (
              <button 
                onClick={handleRemovePhoto}
                disabled={isUploading}
                className="px-4 py-2 text-destructive hover:bg-destructive/10 text-sm font-semibold rounded-xl transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">{t('settings.profileTab.fullName')}</label>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Username</label>
          <input 
            type="text" 
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
            placeholder="johndoe"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Email Address</label>
          <input 
            type="email" 
            value={user?.email || ''}
            readOnly
            className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-muted-foreground cursor-not-allowed"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Phone Number</label>
          <input 
            type="tel" 
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-foreground">{t('settings.profileTab.titleField')}</label>
          <input 
            type="text" 
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleInputChange}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
            placeholder="Senior Software Engineer"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-foreground">{t('settings.profileTab.bio')}</label>
          <textarea 
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground resize-none"
            placeholder="Tell us a little bit about yourself..."
          />
        </div>
      </div>

      <div className="pt-6 border-t border-border flex items-center justify-between">
        <div>
          {message.text && (
            <span className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-500' : 'text-destructive'}`}>
              {message.text}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            className="px-6 py-2.5 rounded-xl font-semibold text-foreground bg-secondary hover:bg-secondary/80 transition-colors border border-border"
            onClick={() => {
              setFormData({
                name: user?.name || '',
                username: user?.username || '',
                phone: user?.phone || '',
                jobTitle: user?.jobTitle || '',
                bio: user?.bio || '',
              });
              setAvatarFile(null);
              setAvatarPreview(user?.avatarUrl || null);
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? t('settings.profileTab.saving') : t('settings.profileTab.save')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
