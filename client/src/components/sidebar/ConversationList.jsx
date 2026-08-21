'use client';

import { useAuthStore } from '../../store/useAuthStore.js';
import { useChatStore } from '../../store/useChatStore.js';
import { useSocketStore } from '../../store/useSocketStore.js';
import PresenceBadge from '../common/PresenceBadge.jsx';
import { MessageSquare } from 'lucide-react';

export default function ConversationList() {
  const currentUserId = useAuthStore((state) => state.user?._id || state.user?.id);
  const { conversations, activeConversationId, setActiveConversationId, isLoadingConversations } =
    useChatStore();
  const onlineUsers = useSocketStore((state) => state.onlineUsers);

  if (isLoadingConversations) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-800 rounded w-24"></div>
              <div className="h-2 bg-slate-800 rounded w-36"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 space-y-2">
        <MessageSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
        <p className="text-xs font-medium">No conversations yet</p>
        <p className="text-[11px] text-slate-600">
          Use the search bar above to start a chat.
        </p>
      </div>
    );
  }

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="divide-y divide-slate-800/40 overflow-y-auto">
      {conversations.map((conv) => {
        const partner = conv.participants.find(
          (p) => (p._id || p.id)?.toString() !== currentUserId?.toString()
        ) || conv.participants[0];

        const isActive = conv._id === activeConversationId;
        const partnerPresence = onlineUsers.get(partner?._id || partner?.id);
        const isOnline = partnerPresence ? partnerPresence.isOnline : partner?.isOnline;
        const lastSeen = partnerPresence ? partnerPresence.lastSeen : partner?.lastSeen;

        const lastMsg = conv.lastMessage;

        return (
          <button
            key={conv._id}
            onClick={() => setActiveConversationId(conv._id)}
            className={`w-full p-3.5 flex items-center gap-3 text-left transition-all relative ${
              isActive
                ? 'bg-indigo-600/10 border-l-4 border-indigo-500'
                : 'hover:bg-slate-900/60'
            }`}
          >
            <div className="relative shrink-0">
              <img
                src={partner?.avatarUrl}
                alt={partner?.username}
                className="w-10 h-10 rounded-full object-cover border border-slate-800"
              />
              <div className="absolute bottom-0 right-0">
                <PresenceBadge isOnline={isOnline} lastSeen={lastSeen} showText={false} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-slate-100 truncate">
                  @{partner?.username}
                </span>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {formatTimestamp(conv.updatedAt)}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 truncate">
                {lastMsg?.text ? (
                  <span>
                    {lastMsg.senderId === currentUserId || lastMsg.senderId?._id === currentUserId
                      ? 'You: '
                      : ''}
                    {lastMsg.text}
                  </span>
                ) : (
                  <span className="italic text-slate-600">Started a conversation</span>
                )}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
