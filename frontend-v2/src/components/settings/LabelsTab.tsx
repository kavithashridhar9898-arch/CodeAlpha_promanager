'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Tag, Plus, Trash2, Pencil, X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#64748b',
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
            value === c ? 'border-white scale-110' : 'border-transparent'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded-full cursor-pointer border-2 border-border"
        title="Custom color"
      />
    </div>
  );
}

export function LabelsTab() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const { data: labels, isLoading } = useQuery<Label[]>({
    queryKey: ['labels'],
    queryFn: async () => {
      const { data } = await api.get('/labels');
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/labels', { name: newName, color: newColor }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      setNewName('');
      setNewColor('#6366f1');
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color: string }) =>
      api.patch(`/labels/${id}`, { name, color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/labels/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['labels'] }),
  });

  const startEdit = (label: Label) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Labels</h2>
        <p className="text-sm text-muted-foreground mt-1">Create and manage labels to categorize your tasks across all projects.</p>
      </div>

      <div className="space-y-4 bg-secondary/20 p-6 rounded-3xl border border-border">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">All Labels</h3>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> New Label
            </button>
          )}
        </div>

        {/* Create form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-card border border-primary/30 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg shrink-0 shadow"
                    style={{ backgroundColor: newColor }}
                  />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Label name..."
                    autoFocus
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <ColorPicker value={newColor} onChange={setNewColor} />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-1.5 text-muted-foreground hover:text-foreground text-sm font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createMutation.mutate()}
                    disabled={!newName.trim() || createMutation.isPending}
                    className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg disabled:opacity-50"
                  >
                    {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Labels list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-secondary/50 rounded-xl animate-pulse" />)}
          </div>
        ) : labels?.length === 0 ? (
          <div className="text-center py-8">
            <Tag className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground">No labels yet. Create your first label above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {labels?.map((label) => (
                <motion.div
                  key={label.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {editingId === label.id ? (
                    <div className="p-4 bg-card border border-primary/30 rounded-2xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg shrink-0 shadow" style={{ backgroundColor: editColor }} />
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                          autoFocus
                        />
                      </div>
                      <ColorPicker value={editColor} onChange={setEditColor} />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="px-4 py-1.5 text-muted-foreground text-sm font-semibold rounded-lg">
                          Cancel
                        </button>
                        <button
                          onClick={() => updateMutation.mutate({ id: label.id, name: editName, color: editColor })}
                          disabled={!editName.trim() || updateMutation.isPending}
                          className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg disabled:opacity-50"
                        >
                          {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl group">
                      <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                      <span className="flex-1 text-sm font-semibold text-foreground">{label.name}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(label)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(label.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
