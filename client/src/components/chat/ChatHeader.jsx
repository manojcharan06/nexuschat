'use client';

import { useAuthStore } from '../../store/useAuthStore.js';
import { useSocketStore } from '../../store/useSocketStore.js';
import PresenceBadge from '../common/PresenceBadge.jsx';
import { ArrowLeft, MoreVertical } from 'lucide-react';

export default function ChatHeader({ conversation, onBack }) {
  const currentUserId = useAuthStore((state) => state.user?._id || state.user?.id);
  const onlineUsers = useSocketStore((state) => state.onlineUsers);

  if (!conversation) return null;

  const partner =
    conversation.participants?.find(
      (p) => (p._id || p.id)?.toString() !== currentUserId?.toString()
    ) || conversation.participants?.[0];

  const partnerPresence = onlineUsers.get(partner?._id || partner?.id);
  const isOnline = partnerPresence ? partnerPresence.isOnline : partner?.isOnline;
  const lastSeen = partnerPresence ? partnerPresence.lastSeen : partner?.lastSeen;

  return (
    <div className="h-16 px-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="relative">
          <img
            src={partner?.avatarUrl}
            alt={partner?.username}
            className="w-10 h-10 rounded-full object-cover border border-indigo-500/40"
          />
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-100">@{partner?.username}</h2>
          <PresenceBadge isOnline={isOnline} lastSeen={lastSeen} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
