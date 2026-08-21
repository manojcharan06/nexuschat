import { create } from 'zustand';

export const useSocketStore = create((set) => ({
  socket: null,
  isConnected: false,
  onlineUsers: new Map(), // Map<userId, { username, isOnline, lastSeen }>

  setSocket: (socket) => set({ socket }),

  setIsConnected: (isConnected) => set({ isConnected }),

  setPresence: (userId, presenceData) =>
    set((state) => {
      const updatedMap = new Map(state.onlineUsers);
      updatedMap.set(userId, presenceData);
      return { onlineUsers: updatedMap };
    }),

  clearSocket: () =>
    set((state) => {
      if (state.socket) {
        state.socket.disconnect();
      }
      return { socket: null, isConnected: false, onlineUsers: new Map() };
    }),
}));
