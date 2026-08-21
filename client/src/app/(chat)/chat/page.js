'use client';

import { useAuthStore } from '../../../store/useAuthStore.js';
import { MessageSquare, LogOut, User, ShieldCheck } from 'lucide-react';

export default function ChatPage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-100 tracking-tight leading-none">
              NexusChat
            </h1>
            <span className="text-xs text-indigo-400 font-medium">Workspace Active</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-full px-3 py-1.5">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-7 h-7 rounded-full object-cover border border-indigo-500/50"
              />
            ) : (
              <User className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-sm font-semibold text-slate-200">{user?.username}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/10 hover:text-red-400 border border-slate-700/50 text-slate-400 transition-all flex items-center gap-2 text-xs font-semibold"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body Placeholder */}
      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 shadow-xl shadow-indigo-950/40">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          Authentication Engine Verified
        </h2>

        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          You are securely logged in as <span className="text-indigo-400 font-semibold">{user?.email}</span>. Your session is protected by short-lived JWT Access Tokens in memory and long-lived HttpOnly Refresh Cookies.
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full text-left font-mono text-xs text-slate-400 space-y-1">
          <div><span className="text-indigo-400">User ID:</span> {user?._id || user?.id}</div>
          <div><span className="text-indigo-400">Username:</span> {user?.username}</div>
          <div><span className="text-indigo-400">Status Message:</span> {user?.statusMessage}</div>
          <div><span className="text-indigo-400">Online Status:</span> True</div>
        </div>
      </main>
    </div>
  );
}
