'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Hash, Users, Globe, Search, Loader2 } from 'lucide-react';
import { useChatStore, ConversationType } from '@/store/chatStore';
import { api } from '@/lib/axios';

interface UserOption {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

const TYPE_OPTIONS: { type: ConversationType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'DIRECT', label: 'Direct Message', icon: <MessageSquare className="w-4 h-4" />, desc: '1-on-1 private conversation' },
  { type: 'GROUP', label: 'Group Chat', icon: <Hash className="w-4 h-4" />, desc: 'Named group conversation' },
  { type: 'WORKSPACE', label: 'Workspace Channel', icon: <Globe className="w-4 h-4" />, desc: 'Open to all workspace members' },
];

export function NewConversationModal({ isOpen, onClose, onCreated }: Props) {
  const { createConversation } = useChatStore();
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<ConversationType>('DIRECT');
  const [name, setName] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search users
  useEffect(() => {
    if (userQuery.length < 2) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get('/search', { params: { q: userQuery, type: 'users' } });
        setSearchResults(res.data.data?.users || []);
      } catch { setSearchResults([]); }
      finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [userQuery]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let conv;
      if (selectedType === 'DIRECT') {
        if (selectedUsers.length !== 1) return;
        conv = await createConversation({ type: 'DIRECT', targetUserId: selectedUsers[0].id });
      } else {
        conv = await createConversation({
          type: selectedType,
          name,
          memberUserIds: selectedUsers.map((u) => u.id),
        });
      }
      onCreated(conv.id);
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('type');
    setName('');
    setUserQuery('');
    setSelectedUsers([]);
    setSearchResults([]);
    onClose();
  };

  const toggleUser = (u: UserOption) => {
    setSelectedUsers((prev) =>
      prev.some((x) => x.id === u.id) ? prev.filter((x) => x.id !== u.id) : [...prev, u],
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-semibold">New Conversation</h2>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-4">
                {step === 'type' && (
                  <>
                    <p className="text-sm text-muted-foreground">Choose conversation type</p>
                    <div className="space-y-2">
                      {TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.type}
                          onClick={() => { setSelectedType(opt.type); setStep('config'); }}
                          className="w-full flex items-center gap-4 p-4 bg-secondary/40 border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{opt.icon}</div>
                          <div>
                            <p className="font-medium text-sm">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {step === 'config' && (
                  <>
                    <button onClick={() => setStep('type')} className="text-xs text-muted-foreground hover:text-foreground">← Back</button>

                    {/* Name (for non-DM) */}
                    {selectedType !== 'DIRECT' && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Channel Name</label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. design-team"
                          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    )}

                    {/* User search */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        {selectedType === 'DIRECT' ? 'Select User' : 'Add Members'}
                      </label>
                      <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl px-3 py-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <input
                          value={userQuery}
                          onChange={(e) => setUserQuery(e.target.value)}
                          placeholder="Search by name or email..."
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                        {isSearching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      </div>

                      {searchResults.length > 0 && (
                        <div className="mt-2 border border-border rounded-xl overflow-hidden">
                          {searchResults.map((u) => {
                            const selected = selectedUsers.some((x) => x.id === u.id);
                            return (
                              <button
                                key={u.id}
                                onClick={() => toggleUser(u)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${selected ? 'bg-primary/10' : 'hover:bg-secondary'}`}
                              >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                  {u.name.charAt(0)}
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium">{u.name}</p>
                                  <p className="text-[11px] text-muted-foreground">{u.email}</p>
                                </div>
                                {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Selected users */}
                      {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedUsers.map((u) => (
                            <div key={u.id} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
                              <span>{u.name}</span>
                              <button onClick={() => toggleUser(u)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || (selectedType === 'DIRECT' && selectedUsers.length !== 1) || (selectedType !== 'DIRECT' && !name.trim())}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Conversation'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
