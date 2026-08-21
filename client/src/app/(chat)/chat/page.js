'use client';

import { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore.js';
import { useSocketStore } from '../../../store/useSocketStore.js';
import { useSocket } from '../../../hooks/useSocket.js';
import UserProfileModal from '../../../components/profile/UserProfileModal.jsx';
import PresenceBadge from '../../../components/common/PresenceBadge.jsx';
import { MessageSquare, LogOut, Settings, Radio, Sparkles } from 'lucide-react';

export default function ChatPage() {
  // Initialize Socket.IO connection hook
  useSocket();

  const { user, logout } = useAuthStore();
  const { isConnected } = useSocketStore();
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
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              ></span>
              <span className="text-[11px] text-slate-400 font-medium">
                {isConnected ? 'Socket Connected' : 'Connecting Socket...'}
              </span>
            </div>
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
          <Radio className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            Phase 4 Socket.IO Real-Time Engine Active
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            WebSocket handshake authentication and live presence broadcasting (`user:online`, `user:offline`, `lastSeen`) are actively connected to the server.
          </p>
        </div>

        {/* Current Active Profile Card with Live Presence */}
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
              </h3>
              <div className="mt-1">
                <PresenceBadge isOnline={isConnected} lastSeen={user?.lastSeen} />
              </div>
              <p className="text-xs text-indigo-400 font-medium italic mt-1">
                &quot;{user?.statusMessage}&quot;
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>WebSocket Status: <strong className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>{isConnected ? 'Connected (Authenticated)' : 'Disconnected'}</strong></span>
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
