'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  CheckSquare, 
  Bell, 
  Search, 
  Settings, 
  LogOut,
  Menu,
  X,
  Users,
  Briefcase,
  CalendarDays,
  MessageSquare,
  Activity,
  Link2,
  Zap,
  Clock,
  FileSpreadsheet,
  PieChart,
  Network
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { NotificationDropdown } from '@/components/layout/NotificationDropdown';
import { KeyboardShortcutsModal } from '@/components/layout/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ProAIFab } from '@/components/ai/ProAIFab';
import { ProAIDrawer } from '@/components/ai/ProAIDrawer';
import { FloatingTimer } from '@/components/time/FloatingTimer';

import { useTranslation } from 'react-i18next';

const NAV_KEYS = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'projects', href: '/dashboard/projects', icon: KanbanSquare },
  { key: 'teams', href: '/dashboard/teams', icon: Users },
  { key: 'calendar', href: '/dashboard/calendar', icon: CalendarDays },
  { key: 'chat', href: '/dashboard/chat', icon: MessageSquare },
  { key: 'activity', href: '/dashboard/activity', icon: Activity },
  { key: 'integrations', href: '/dashboard/integrations', icon: Link2 },
  { key: 'automations', href: '/dashboard/automations', icon: Zap },
  { key: 'time', href: '/dashboard/time', icon: Clock },
  { key: 'timesheets', href: '/dashboard/timesheets', icon: FileSpreadsheet },
  { key: 'resources', href: '/dashboard/resources', icon: Network },
  { key: 'reports', href: '/dashboard/reports', icon: PieChart },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, checkAuth } = useAuthStore();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    { key: '?', description: 'Show keyboard shortcuts', action: () => setIsShortcutsOpen(true) },
    { key: 'd', description: 'Dashboard', action: () => {} }, // handled by sequence logic below
  ]);

  // Listen for custom event from Command Palette
  useEffect(() => {
    const handler = () => setIsShortcutsOpen(true);
    window.addEventListener('open-shortcuts', handler);
    return () => window.removeEventListener('open-shortcuts', handler);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_-3px_rgba(79,70,229,0.4)]">
              <span className="text-primary-foreground font-bold text-lg">P</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">ProManager</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_KEYS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.key} href={item.href} className="relative block">
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}>
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">
                    {['automations', 'time', 'timesheets', 'resources', 'reports'].includes(item.key) 
                      ? item.key.charAt(0).toUpperCase() + item.key.slice(1) 
                      : t(`sidebar.${item.key}`)}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold uppercase shrink-0 shadow-inner overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('sidebar.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-muted-foreground" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Global Search Bar */}
            <div 
              onClick={() => setIsCommandOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 h-10 rounded-full bg-secondary/50 border border-border w-64 hover:ring-2 hover:ring-primary/30 hover:border-primary/50 transition-all cursor-text"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground flex-1">Search workspace...</span>
              <kbd className="hidden lg:inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-background border border-border text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <Link href="/dashboard/settings" className="w-10 h-10 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </main>
      </div>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      
      {/* ProAI Integration */}
      <ProAIFab />
      <ProAIDrawer />
      
      {/* Time Tracking Widget */}
      <FloatingTimer />
    </div>
  );
}

