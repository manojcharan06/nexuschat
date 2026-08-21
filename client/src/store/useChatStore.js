import { create } from 'zustand';

export const useChatStore = create((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  unreadCounts: {},

  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (activeConversationId) => set({ activeConversationId }),
  setMessages: (conversationId, messageList) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messageList,
      },
    })),
}));
