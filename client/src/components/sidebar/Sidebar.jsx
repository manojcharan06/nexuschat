'use client';

import UserSearch from './UserSearch.jsx';
import ConversationList from './ConversationList.jsx';
import { MessageSquare, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';

export default function Sidebar({ onOpenProfile }) {
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-full md:w-80 lg:w-80 bg-slate-950 border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Sidebar Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base text-slate-100 tracking-tight">
            NexusChat
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenProfile}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
            title="Profile Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Search Bar */}
      <UserSearch />

      {/* Active Conversation Threads List */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList />
      </div>

      {/* Bottom Auth User Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/30 flex items-center gap-3">
        <img
          src={user?.avatarUrl}
          alt={user?.username}
          className="w-8 h-8 rounded-full object-cover border border-indigo-500/40"
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-200 truncate">@{user?.username}</div>
          <div className="text-[10px] text-slate-400 truncate">{user?.statusMessage || 'Available'}</div>
        </div>
      </div>
    </aside>
  );
}
