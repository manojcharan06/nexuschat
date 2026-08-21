'use client';

import { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore.js';
import UserProfileModal from '../../../components/profile/UserProfileModal.jsx';
import { MessageSquare, LogOut, Settings, ShieldCheck, Sparkles } from 'lucide-react';

export default function ChatPage() {
  const { user, logout } = useAuthStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

        <div className="flex items-center gap-3">
          {/* User Profile Card Button */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-full px-3 py-1.5 transition-all text-left group"
          >
            <img
              src={user?.avatarUrl}
              alt={user?.username}
              className="w-7 h-7 rounded-full object-cover border border-indigo-500/50 group-hover:border-indigo-400 transition-all"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white leading-tight">
                {user?.username}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                {user?.statusMessage || 'Available'}
              </span>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors ml-1" />
          </button>

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
      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-xl shadow-indigo-950/40">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            Phase 3 User Profile System Verified
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Click your user pill in the header above or click the button below to test live avatar uploads and status bio updates.
          </p>
        </div>

        {/* Current Active Profile Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 w-full text-left space-y-4 shadow-2xl">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatarUrl}
              alt={user?.username}
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/50 shadow-md"
            />
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                @{user?.username}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              </h3>
              <p className="text-xs text-indigo-400 font-medium italic mt-0.5">
                &quot;{user?.statusMessage}&quot;
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Email: <strong className="text-slate-200">{user?.email}</strong></span>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          </div>
        </div>
      </main>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
