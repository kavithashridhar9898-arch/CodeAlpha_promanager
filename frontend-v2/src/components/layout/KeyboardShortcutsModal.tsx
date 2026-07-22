'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { GLOBAL_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const groupBy = <T,>(arr: T[], key: keyof T) => {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

export function KeyboardShortcutsModal({ isOpen, onClose }: Props) {
  const grouped = groupBy(GLOBAL_SHORTCUTS, 'section');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Keyboard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Keyboard Shortcuts</h2>
                  <p className="text-xs text-muted-foreground">Speed up your workflow</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {Object.entries(grouped).map(([section, shortcuts]) => (
                <div key={section}>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{section}</h3>
                  <div className="space-y-2">
                    {shortcuts.map((s, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-secondary/40 transition-colors">
                        <span className="text-sm text-foreground">{s.description}</span>
                        <div className="flex items-center gap-1">
                          {s.ctrlOrMeta && (
                            <kbd className="px-2 py-1 text-xs font-mono font-bold bg-secondary border border-border rounded-lg text-muted-foreground">
                              ⌘/Ctrl
                            </kbd>
                          )}
                          {s.shift && (
                            <kbd className="px-2 py-1 text-xs font-mono font-bold bg-secondary border border-border rounded-lg text-muted-foreground">
                              Shift
                            </kbd>
                          )}
                          <kbd className="px-2 py-1 text-xs font-mono font-bold bg-secondary border border-border rounded-lg text-foreground min-w-[2rem] text-center">
                            {s.key === 'Escape' ? 'Esc' : s.key.toUpperCase()}
                          </kbd>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-border bg-secondary/10 text-center">
              <p className="text-xs text-muted-foreground">Press <kbd className="px-1.5 py-0.5 text-xs bg-secondary rounded border border-border">?</kbd> anywhere to reopen this dialog</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
