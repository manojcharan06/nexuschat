'use client';

import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useChatStore } from '../../store/useChatStore.js';
import { useSocketStore } from '../../store/useSocketStore.js';
import { Send, Image as ImageIcon } from 'lucide-react';

export default function ChatInputComposer({ conversationId }) {
  const [text, setText] = useState('');
  const currentUser = useAuthStore((state) => state.user);
  const socket = useSocketStore((state) => state.socket);
  const { addOptimisticMessage, confirmOptimisticMessage } = useChatStore();

  const handleSend = (e) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText || !conversationId) return;

    // Generate optimistic tempId
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const optimisticMessage = {
      tempId,
      _id: tempId,
      conversationId,
      senderId: currentUser,
      text: trimmedText,
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    // 1. Instant Optimistic UI Update
    addOptimisticMessage(conversationId, optimisticMessage);
    setText('');

    // 2. Emit Socket.IO Event
    if (socket && socket.connected) {
      socket.emit(
        'message:send',
        {
          conversationId,
          text: trimmedText,
          tempId,
        },
        (ack) => {
          if (ack && ack.status === 'success' && ack.data) {
            confirmOptimisticMessage(conversationId, tempId, ack.data);
          } else {
            console.error('Socket message send error:', ack?.message);
          }
        }
      );
    } else {
      console.warn('Socket disconnected. Unable to send real-time message.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <form
      onSubmit={handleSend}
      className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/60 backdrop-blur-xl shrink-0"
    >
      <div className="flex items-center gap-2 max-w-4xl mx-auto">
        <button
          type="button"
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all shrink-0"
          title="Attach Image"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim()}
          className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
