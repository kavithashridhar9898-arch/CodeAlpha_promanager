'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Shortcut {
  key: string;
  ctrlOrMeta?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire inside text inputs
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !shortcut.ctrlOrMeta || (e.ctrlKey || e.metaKey);
        const shiftMatch = !shortcut.shift || e.shiftKey;
        
        if (keyMatch && ctrlMatch && shiftMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export interface GlobalShortcutItem {
  key: string;
  ctrlOrMeta?: boolean;
  shift?: boolean;
  description: string;
  section: string;
}

export const GLOBAL_SHORTCUTS: GlobalShortcutItem[] = [
  { key: 'k', ctrlOrMeta: true, description: 'Open command palette', section: 'Navigation' },
  { key: '?', description: 'Show keyboard shortcuts', section: 'Navigation' },
  { key: 'g', description: 'Then D: Go to Dashboard', section: 'Navigation' },
  { key: 'g', description: 'Then P: Go to Projects', section: 'Navigation' },
  { key: 'g', description: 'Then C: Go to Calendar', section: 'Navigation' },
  { key: 'g', description: 'Then T: Go to Teams', section: 'Navigation' },
  { key: 'n', description: 'Then P: New Project', section: 'Actions' },
  { key: 'Escape', description: 'Close modal / dialog', section: 'General' },
];
