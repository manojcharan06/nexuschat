'use client';

import { useAuthStore } from '../../store/useAuthStore.js';
import { useSocketStore } from '../../store/useSocketStore.js';
import PresenceBadge from '../common/PresenceBadge.jsx';
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react';

export default function ChatHeader({ conversation, onBack }) {
  const currentUserId = useAuthStore((state) => state.user?._id || state.user?.id);
  const onlineUsers = useSocketStore((state) => state.onlineUsers);
  const isConnected = useSocketStore((state) => state.isConnected);

  if (!conversation) return null;

  const partner =
    conversation.participants?.find(
      (p) => (p._id || p.id)?.toString() !== currentUserId?.toString()
    ) || conversation.participants?.[0];

  const partnerPresence = onlineUsers.get(partner?._id || partner?.id);
  const isOnline = partnerPresence ? partnerPresence.isOnline : partner?.isOnline;
  const lastSeen = partnerPresence ? partnerPresence.lastSeen : partner?.lastSeen;

  return (
    <header className="h-16 px-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back to conversations"
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="relative">
          <img
            src={partner?.avatarUrl}
            alt={`${partner?.username}'s avatar`}
            className="w-10 h-10 rounded-full object-cover border border-indigo-500/40"
          />
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-100">@{partner?.username}</h2>
          <PresenceBadge isOnline={isOnline} lastSeen={lastSeen} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Socket Connection Health Pill */}
        <div
          title={isConnected ? 'Socket Connected' : 'Socket Reconnecting...'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
            isConnected
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-300 animate-pulse'
          }`}
        >
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Reconnecting</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
