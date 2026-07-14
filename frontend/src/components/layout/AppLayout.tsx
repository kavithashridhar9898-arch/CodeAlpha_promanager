import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { NotificationBell } from '../notifications/NotificationBell';
import { LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { useGlobalSocket } from '../../hooks/useGlobalSocket';
import { GlobalSearch } from './GlobalSearch';

export const AppLayout: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  // Initialize global socket to receive personal notifications
  useGlobalSocket();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                ProManager
              </span>
            </Link>

            {/* Global Search */}
            <div className="hidden md:flex flex-1 justify-center px-6">
              <GlobalSearch />
            </div>

            {/* Right side navigation */}
            <div className="flex items-center gap-4">
              <NotificationBell />
              
              <Link to="/settings" className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-slate-800 focus:outline-none">
                <Settings className="w-5 h-5" />
              </Link>
              
              <div className="h-6 w-px bg-slate-700 mx-1"></div>
              
              <div className="flex items-center gap-3">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full ring-2 ring-slate-800" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-800">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-300 hidden sm:block">{user?.name}</span>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-red-500/10 ml-2"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
