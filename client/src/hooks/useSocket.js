'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSocketStore } from '../store/useSocketStore.js';
import { useChatStore } from '../store/useChatStore.js';
import { getConversationsApi } from '../api/chat.api.js';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeConversationId = useChatStore((state) => state.activeConversationId);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      const currentSocket = useSocketStore.getState().socket;
      if (currentSocket) {
        useSocketStore.getState().clearSocket();
      }
      return;
    }

    let socketInstance = useSocketStore.getState().socket;

    // Singleton connection management: create socket only if it does not exist or is not connected
    if (!socketInstance || (!socketInstance.connected && !socketInstance.connecting)) {
      socketInstance = io(SOCKET_URL, {
        auth: {
          token: `Bearer ${accessToken}`,
        },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      useSocketStore.getState().setSocket(socketInstance);

      socketInstance.on('connect', () => {
        useSocketStore.getState().setIsConnected(true);
      });

      socketInstance.on('connection:success', () => {
        useSocketStore.getState().setIsConnected(true);
      });

      socketInstance.on('user:presence_changed', (data) => {
        const { userId, username, isOnline, lastSeen } = data;
        useSocketStore.getState().setPresence(userId, { username, isOnline, lastSeen });
      });

      // Handle real-time incoming messages
      socketInstance.on('message:received', async (message) => {
        if (message && message.conversationId) {
          const store = useChatStore.getState();
          store.appendIncomingMessage(message.conversationId, message);

          const convExists = store.conversations.some((c) => c._id === message.conversationId);
          if (!convExists) {
            try {
              const res = await getConversationsApi();
              if (res.data) {
                useChatStore.getState().setConversations(res.data);
              }
            } catch (err) {
              console.error('Failed to sync conversations on message:received:', err);
            }
          }
        }
      });

      socketInstance.on('disconnect', () => {
        useSocketStore.getState().setIsConnected(false);
      });

      socketInstance.on('connect_error', () => {
        useSocketStore.getState().setIsConnected(false);
      });
    } else if (socketInstance) {
      socketInstance.auth = { token: `Bearer ${accessToken}` };
    }

    return () => {
      if (!useAuthStore.getState().isAuthenticated) {
        useSocketStore.getState().clearSocket();
      }
    };
  }, [accessToken, isAuthenticated]);

  // Handle active conversation room join
  useEffect(() => {
    const socketInstance = useSocketStore.getState().socket;
    if (socketInstance && socketInstance.connected && activeConversationId) {
      socketInstance.emit('conversation:join', { conversationId: activeConversationId });
    }
  }, [activeConversationId]);
}
