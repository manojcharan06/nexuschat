'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useChatStore } from '../../store/useChatStore.js';
import { useSocketStore } from '../../store/useSocketStore.js';
import { getMessagesApi } from '../../api/chat.api.js';
import MessageBubble from './MessageBubble.jsx';
import { Loader2, MessageSquare } from 'lucide-react';

export default function MessageList({ conversationId }) {
  const currentUserId = useAuthStore((state) => state.user?._id || state.user?.id);
  const { messages, hasMore, nextCursors, setMessages, prependMessages, isLoadingMessages, setIsLoadingMessages } =
    useChatStore();

  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const isFetchingOlderRef = useRef(false);

  const conversationMessages = messages[conversationId] || [];
  const hasMoreHistory = hasMore[conversationId];
  const nextCursor = nextCursors[conversationId];

  // Fetch initial message history
  useEffect(() => {
    if (!conversationId) return;

    const fetchInitialMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await getMessagesApi(conversationId, { limit: 30 });
        const { messages: fetchedMsgs, hasMore: more, nextCursor: cursor } = res.data;
        setMessages(conversationId, fetchedMsgs, more, cursor);
      } catch (err) {
        console.error('Failed to fetch message history:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    if (!messages[conversationId]) {
      fetchInitialMessages();
    }
  }, [conversationId, setMessages, setIsLoadingMessages, messages]);

  // Emit delivery acknowledgements for unacknowledged incoming messages when viewing thread
  useEffect(() => {
    if (!conversationMessages || conversationMessages.length === 0 || !conversationId) return;

    const socket = useSocketStore.getState().socket;
    if (!socket || !socket.connected) return;

    conversationMessages.forEach((msg) => {
      const senderIdStr = (msg.senderId?._id || msg.senderId)?.toString();
      const isIncoming = senderIdStr && currentUserId && senderIdStr !== currentUserId.toString();

      if (isIncoming && msg.status === 'sent' && msg._id) {
        socket.emit('message:delivered:ack', {
          messageId: msg._id,
          conversationId,
        });
      }
    });
  }, [conversationId, conversationMessages, currentUserId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages.length]);

  // Infinite scroll upwards for older message log
  const handleScroll = async () => {
    if (!containerRef.current || !hasMoreHistory || isFetchingOlderRef.current) return;

    if (containerRef.current.scrollTop < 50) {
      isFetchingOlderRef.current = true;
      try {
        const prevHeight = containerRef.current.scrollHeight;

        const res = await getMessagesApi(conversationId, {
          limit: 30,
          before: nextCursor,
        });

        const { messages: olderMsgs, hasMore: more, nextCursor: newCursor } = res.data;
        prependMessages(conversationId, olderMsgs, more, newCursor);

        // Adjust scroll position to maintain view focus
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight - prevHeight;
          }
        });
      } catch (err) {
        console.error('Failed to fetch older messages:', err);
      } finally {
        isFetchingOlderRef.current = false;
      }
    }
  };

  const formatDateLabel = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'Today';

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoadingMessages && conversationMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="text-xs font-medium">Loading chat history...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4"
    >
      {hasMoreHistory && (
        <div className="text-center py-2">
          <span className="text-[10px] text-slate-500 font-medium">Scroll up for older messages</span>
        </div>
      )}

      {conversationMessages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-300">No messages yet</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Send a message below to start the conversation!
          </p>
        </div>
      ) : (
        conversationMessages.map((msg, index) => {
          const showDateSeparator =
            index === 0 ||
            new Date(msg.createdAt).toDateString() !==
              new Date(conversationMessages[index - 1].createdAt).toDateString();

          const senderIdStr = (msg.senderId?._id || msg.senderId)?.toString();
          const isOwn = senderIdStr === currentUserId?.toString();

          return (
            <div key={msg._id || msg.tempId || index}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-400">
                    {formatDateLabel(msg.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble message={msg} isOwn={isOwn} />
            </div>
          );
        })
      )}

      <div ref={bottomRef} />
    </div>
  );
}
