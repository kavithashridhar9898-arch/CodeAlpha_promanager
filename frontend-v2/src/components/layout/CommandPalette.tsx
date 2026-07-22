'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Folder, CheckSquare, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  type: 'project' | 'task' | 'user';
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen ? onClose() : null; // Actually, the layout handles opening.
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        // Adapt response based on backend structure. Assume res.data.data has projects, tasks, users
        const data = res.data.data || { projects: [], tasks: [], users: [] };
        
        const formatted: SearchResult[] = [
          ...data.projects.map((p: any) => ({ ...p, type: 'project' })),
          ...data.tasks.map((t: any) => ({ ...t, type: 'task' })),
          ...data.users.map((u: any) => ({ ...u, type: 'user' })),
        ];
        
        setResults(formatted);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    onClose();
    if (item.type === 'project') router.push(`/dashboard/projects/${item.id}`);
    if (item.type === 'task') router.push(`/dashboard/projects`); // Would ideally open the task drawer
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh] px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center px-4 h-14 border-b border-border gap-3">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search projects, tasks, or users..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {isLoading && (
                  <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    Searching...
                  </div>
                )}
                
                {!isLoading && query && results.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No results found for "{query}"
                  </div>
                )}

                {!isLoading && results.length > 0 && (
                  <div className="space-y-1">
                    {results.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/50 text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          {item.type === 'project' && <Folder className="w-4 h-4 text-blue-500" />}
                          {item.type === 'task' && <CheckSquare className="w-4 h-4 text-emerald-500" />}
                          {item.type === 'user' && <User className="w-4 h-4 text-purple-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.title || item.name}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                          )}
                        </div>
                        <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider px-2 py-1 bg-secondary rounded-md">
                          {item.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {!query && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Type to start searching your workspace</p>
                    <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-secondary">↓↑</kbd> to navigate</span>
                      <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-secondary">↵</kbd> to select</span>
                      <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-secondary">esc</kbd> to close</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
