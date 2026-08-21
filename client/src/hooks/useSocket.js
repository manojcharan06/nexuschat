'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSocketStore } from '../store/useSocketStore.js';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

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
      // In React 18 / Next.js, do not abruptly abort in-flight WebSocket connections on double-mount.
      // Disconnect cleanly only when user logs out or session is unauthenticated.
      if (!useAuthStore.getState().isAuthenticated) {
        useSocketStore.getState().clearSocket();
      }
    };
  }, [accessToken, isAuthenticated]);
}
