import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {}, // Map<conversationId, Array<Message>>
  hasMore: {}, // Map<conversationId, Boolean>
  nextCursors: {}, // Map<conversationId, String>
  isLoadingConversations: false,
  isLoadingMessages: false,

  setIsLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
  setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

  setConversations: (conversations) => set({ conversations }),

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  upsertConversation: (newConv) =>
    set((state) => {
      const existsIndex = state.conversations.findIndex((c) => c._id === newConv._id);
      if (existsIndex !== -1) {
        const updated = [...state.conversations];
        updated[existsIndex] = { ...updated[existsIndex], ...newConv };
        // Sort by updatedAt descending
        updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return { conversations: updated };
      }
      return {
        conversations: [newConv, ...state.conversations],
      };
    }),

  setMessages: (conversationId, messageList, hasMore = false, nextCursor = null) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messageList,
      },
      hasMore: {
        ...state.hasMore,
        [conversationId]: hasMore,
      },
      nextCursors: {
        ...state.nextCursors,
        [conversationId]: nextCursor,
      },
    })),

  prependMessages: (conversationId, olderMessages, hasMore = false, nextCursor = null) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      // Deduplicate older messages by _id
      const existingIds = new Set(existing.map((m) => m._id));
      const filteredOlder = olderMessages.filter((m) => !existingIds.has(m._id));

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...filteredOlder, ...existing],
        },
        hasMore: {
          ...state.hasMore,
          [conversationId]: hasMore,
        },
        nextCursors: {
          ...state.nextCursors,
          [conversationId]: nextCursor,
        },
      };
    }),

  // Add optimistic message using tempId
  addOptimisticMessage: (conversationId, tempMessage) =>
    set((state) => {
      const currentList = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...currentList, tempMessage],
        },
      };
    }),

  // Replace optimistic message matching tempId with server-saved message
  confirmOptimisticMessage: (conversationId, tempId, realMessage) =>
    set((state) => {
      const currentList = state.messages[conversationId] || [];
      const updatedList = currentList.map((m) =>
        m.tempId === tempId || m._id === tempId ? realMessage : m
      );

      // Update lastMessage on active conversation
      const convs = state.conversations.map((c) =>
        c._id === conversationId ? { ...c, lastMessage: realMessage, updatedAt: new Date().toISOString() } : c
      );
      convs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedList,
        },
        conversations: convs,
      };
    }),

  // Append incoming socket message while PREVENTING duplicate rendering
  appendIncomingMessage: (conversationId, message) =>
    set((state) => {
      const currentList = state.messages[conversationId] || [];

      // Check 1: Match tempId if sender received socket emit
      if (message.tempId) {
        const hasTemp = currentList.some((m) => m.tempId === message.tempId || m._id === message.tempId);
        if (hasTemp) {
          const replaced = currentList.map((m) =>
            m.tempId === message.tempId || m._id === message.tempId ? message : m
          );
          return {
            messages: {
              ...state.messages,
              [conversationId]: replaced,
            },
          };
        }
      }

      // Check 2: Deduplicate by real MongoDB _id
      const exists = currentList.some((m) => m._id === message._id);
      if (exists) {
        return state;
      }

      // Update sidebar conversation preview
      const convs = state.conversations.map((c) =>
        c._id === conversationId ? { ...c, lastMessage: message, updatedAt: new Date().toISOString() } : c
      );
      convs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...currentList, message],
        },
        conversations: convs,
      };
    }),
}));
