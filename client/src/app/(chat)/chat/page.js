'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore.js';
import { useChatStore } from '../../../store/useChatStore.js';
import { useSocket } from '../../../hooks/useSocket.js';
import { getConversationsApi } from '../../../api/chat.api.js';

import Sidebar from '../../../components/sidebar/Sidebar.jsx';
import ChatHeader from '../../../components/chat/ChatHeader.jsx';
import MessageList from '../../../components/chat/MessageList.jsx';
import ChatInputComposer from '../../../components/chat/ChatInputComposer.jsx';
import UserProfileModal from '../../../components/profile/UserProfileModal.jsx';
import { MessageSquare, ShieldCheck } from 'lucide-react';

export default function ChatPage() {
  // Initialize Socket.IO engine hook
  useSocket();

  const { isAuthenticated } = useAuthStore();
  const {
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversationId,
    setIsLoadingConversations,
  } = useChatStore();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Fetch initial user conversations
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      try {
        const res = await getConversationsApi();
        const convList = res.data || [];
        setConversations(convList);

        // Restore active conversation from localStorage if valid
        if (typeof window !== 'undefined') {
          const savedActiveId = localStorage.getItem('nexuschat_active_conv');
          if (savedActiveId && convList.some((c) => c._id === savedActiveId)) {
            setActiveConversationId(savedActiveId);
          }
        }
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [isAuthenticated, setConversations, setIsLoadingConversations, setActiveConversationId]);

  const activeConversation = conversations.find((c) => c._id === activeConversationId);

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Sidebar - Visible on Desktop or on Mobile when no active conversation selected */}
      <div
        className={`w-full md:w-80 lg:w-80 h-full shrink-0 transition-all duration-300 ${
          activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <Sidebar onOpenProfile={() => setIsProfileModalOpen(true)} />
      </div>

      {/* Main Chat Area - Visible on Desktop or on Mobile when active conversation selected */}
      <main
        className={`flex-1 flex flex-col h-full min-w-0 bg-slate-950 relative transition-all duration-300 ${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversationId && activeConversation ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              conversation={activeConversation}
              onBack={() => setActiveConversationId(null)}
            />

            {/* Message List Log Container */}
            <MessageList conversationId={activeConversationId} />

            {/* Message Input Composer */}
            <ChatInputComposer conversationId={activeConversationId} />
          </>
        ) : (
          /* Empty Chat Area Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-xl shadow-indigo-950/40">
              <MessageSquare className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-1">
                Your Messages
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Select a conversation from the sidebar or search for a contact to start messaging in real time.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>End-to-End Persistence & Socket Sync Active</span>
            </div>
          </div>
        )}
      </main>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
