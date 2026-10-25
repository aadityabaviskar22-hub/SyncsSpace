import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useProject } from '../context/ProjectContext.js';
import { useSocket } from '../context/SocketContext.js';
import { NotificationDropdown } from './Notifications/NotificationDropdown.js';
import {
  Kanban,
  FileText,
  MessageSquare,
  Bell,
  Sun,
  Moon,
  Users,
  ChevronDown,
  Layers,
  Sparkles,
  Shield,
  Briefcase,
  LogOut,
  FolderKanban,
} from 'lucide-react';
import { INITIAL_USERS } from '../services/mockData.js';

interface NavbarProps {
  activeTab: 'kanban' | 'notes' | 'chat' | 'spec';
  setActiveTab: (tab: 'kanban' | 'notes' | 'chat' | 'spec') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, switchUser, logout } = useAuth();
  const { activeProject, projects, setActiveProject, unreadNotifsCount, teamMembers } = useProject();
  const { isConnected, onlineUsers } = useSocket();

  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Branding & Project Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl shadow-md shadow-indigo-500/20 text-white">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  ProjectHub
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                    REACT CLIENT
                  </span>
                </span>
              </div>
            </div>

            {/* Project Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="max-w-[120px] sm:max-w-[180px] truncate">{activeProject.title}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProjectMenu && (
                <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-2 py-1">
                    Select Workspace
                  </div>
                  {projects.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => {
                        setActiveProject(p);
                        setShowProjectMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                        p._id === activeProject._id
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{p.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                        {p.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center: Module Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'kanban'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban Board
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'notes'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Notes Workspace
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Project Chat
            </button>

            <button
              onClick={() => setActiveTab('spec')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'spec'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Architecture Spec
            </button>
          </nav>

          {/* Right: Live Presences, Notifications, Dark Mode, Profile */}
          <div className="flex items-center gap-3">
            
            {/* Live Online Avatars */}
            <div className="hidden lg:flex items-center -space-x-2">
              {teamMembers.slice(0, 4).map((member) => {
                const isMemberOnline = onlineUsers.includes(member._id);
                return (
                  <div key={member._id} className="relative group" title={`${member.name} (${isMemberOnline ? 'Online' : 'Offline'})`}>
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                    />
                    {isMemberOnline && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900 animate-pulse"></span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} />}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile & Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={user?.name || 'User'}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {user?.name || 'Aditya'}
                  </span>
                  <span
                    className={`text-[10px] font-mono leading-none ${
                      user?.role === 'Manager'
                        ? 'text-blue-500 font-semibold'
                        : user?.role === 'Admin'
                        ? 'text-purple-500 font-semibold'
                        : 'text-emerald-500 font-semibold'
                    }`}
                  >
                    {user?.role || 'Manager'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                  </div>

                  {/* Quick Role Tester Switcher */}
                  <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Switch Test Persona
                  </div>
                  <div className="space-y-1 my-1">
                    {INITIAL_USERS.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => {
                          switchUser(u._id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                          u._id === user?._id
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{u.name}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            u.role === 'Manager'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : u.role === 'Admin'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-1.5">
                    <button
                      onClick={logout}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center gap-2 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Mobile Subnav for tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-3 py-1 rounded-md font-semibold ${activeTab === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1 rounded-md font-semibold ${activeTab === 'notes' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1 rounded-md font-semibold ${activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('spec')}
            className={`px-3 py-1 rounded-md font-semibold ${activeTab === 'spec' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
          >
            Spec
          </button>
        </div>

      </div>
    </header>
  );
};
