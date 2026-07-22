'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Folder, CheckSquare, User, X, 
  LayoutDashboard, CalendarDays, Users, Settings, 
  Plus, Tag, ArrowRight, Keyboard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { useProjects } from '@/hooks/useProjects';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateProject?: () => void;
}

interface SearchResult {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  type: 'project' | 'task' | 'user';
}

interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: any;
  iconColor: string;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette({ isOpen, onClose, onOpenCreateProject }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: projects } = useProjects();

  // Quick navigation actions — shown when query is empty
  const quickActions: QuickAction[] = [
    { id: 'go-dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, iconColor: 'text-primary', action: () => navigate('/dashboard'), shortcut: 'G D' },
    { id: 'go-projects', label: 'Go to Projects', icon: Folder, iconColor: 'text-blue-400', action: () => navigate('/dashboard/projects'), shortcut: 'G P' },
    { id: 'go-calendar', label: 'Go to Calendar', icon: CalendarDays, iconColor: 'text-emerald-400', action: () => navigate('/dashboard/calendar'), shortcut: 'G C' },
    { id: 'go-teams', label: 'Go to Teams', icon: Users, iconColor: 'text-violet-400', action: () => navigate('/dashboard/teams'), shortcut: 'G T' },
    { id: 'go-settings', label: 'Go to Settings', icon: Settings, iconColor: 'text-amber-400', action: () => navigate('/dashboard/settings') },
    { id: 'go-labels', label: 'Manage Labels', icon: Tag, iconColor: 'text-rose-400', action: () => navigate('/dashboard/settings?tab=labels') },
    { id: 'shortcuts', label: 'View Keyboard Shortcuts', icon: Keyboard, iconColor: 'text-muted-foreground', action: () => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent('open-shortcuts')), 100); } },
    ...(onOpenCreateProject ? [{ id: 'create-project', label: 'Create New Project', description: 'Start a new project workspace', icon: Plus, iconColor: 'text-primary', action: () => { onClose(); onOpenCreateProject(); }, shortcut: 'N P' }] : []),
    // Recent projects
    ...(projects?.slice(0, 3).map((p) => ({
      id: `project-${p.id}`,
      label: p.name,
      description: 'Recent Project',
      icon: Folder,
      iconColor: 'text-indigo-400',
      action: () => navigate(`/dashboard/projects/${p.id}`),
    })) || []),
  ];

  const navigate = useCallback((path: string) => {
    onClose();
    router.push(path);
  }, [onClose, router]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      const total = query ? results.length : quickActions.length;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % total);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + total) % total);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (query && results[selectedIndex]) {
          handleSearchSelect(results[selectedIndex]);
        } else if (!query && quickActions[selectedIndex]) {
          quickActions[selectedIndex].action();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, query, results, selectedIndex, quickActions, onClose]);

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        const data = res.data.data || { projects: [], tasks: [], users: [] };
        const formatted: SearchResult[] = [
          ...data.projects.map((p: any) => ({ ...p, type: 'project' as const })),
          ...data.tasks.map((t: any) => ({ ...t, type: 'task' as const })),
          ...data.users.map((u: any) => ({ ...u, type: 'user' as const })),
        ];
        setResults(formatted);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSelect = async (item: SearchResult) => {
    onClose();
    if (item.type === 'project') router.push(`/dashboard/projects/${item.id}`);
    if (item.type === 'task') {
      try {
        const res = await api.get(`/tasks/${item.id}`);
        const projectId = res.data.data.column.board.projectId;
        router.push(`/dashboard/projects/${projectId}?taskId=${item.id}`);
      } catch {}
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Search input */}
            <div className="flex items-center px-4 h-14 border-b border-border gap-3">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search or type a command..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground text-sm"
              />
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:flex text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-secondary">ESC</kbd>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-2">
              {/* Loading state */}
              {isLoading && (
                <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  Searching...
                </div>
              )}

              {/* Search results */}
              {!isLoading && query && results.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No results found for "<span className="text-foreground">{query}</span>"
                </div>
              )}

              {!isLoading && query && results.length > 0 && (
                <div className="space-y-0.5">
                  <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Results</p>
                  {results.map((item, idx) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSearchSelect(item)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                        idx === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        {item.type === 'project' && <Folder className="w-4 h-4 text-blue-400" />}
                        {item.type === 'task' && <CheckSquare className="w-4 h-4 text-emerald-400" />}
                        {item.type === 'user' && <User className="w-4 h-4 text-purple-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title || item.name}</p>
                        {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-secondary rounded-md text-muted-foreground">
                        {item.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Quick actions when empty */}
              {!query && (
                <div className="space-y-0.5">
                  <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
                  {quickActions.map((action, idx) => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors group ${
                        idx === selectedIndex ? 'bg-primary/10' : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{action.label}</p>
                        {action.description && <p className="text-xs text-muted-foreground">{action.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {action.shortcut && (
                          <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">
                            {action.shortcut}
                          </span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-secondary/20">
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-secondary border border-border">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-secondary border border-border">↵</kbd> select</span>
              </div>
              <span className="text-[10px] text-muted-foreground">ProManager</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
