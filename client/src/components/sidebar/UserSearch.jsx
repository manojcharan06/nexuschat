'use client';

import { useState, useEffect } from 'react';
import { searchUsersApi, createDirectConversationApi } from '../../api/chat.api.js';
import { useChatStore } from '../../store/useChatStore.js';
import PresenceBadge from '../common/PresenceBadge.jsx';
import { Search, Loader2, X, UserPlus } from 'lucide-react';

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { upsertConversation, setActiveConversationId } = useChatStore();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchUsersApi(query.trim());
        setResults(res.data || []);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectUser = async (user) => {
    try {
      const res = await createDirectConversationApi(user._id);
      const conversation = res.data;
      upsertConversation(conversation);
      setActiveConversationId(conversation._id);
      setQuery('');
      setResults([]);
    } catch (err) {
      console.error('Failed to open conversation:', err);
    }
  };

  return (
    <div className="relative p-3 border-b border-slate-800">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts..."
          className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown List */}
      {query && (
        <div className="absolute left-3 right-3 top-14 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-800/60">
          {loading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Searching users...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No users found matching &quot;{query}&quot;
            </div>
          ) : (
            results.map((u) => (
              <button
                key={u._id}
                onClick={() => handleSelectUser(u)}
                className="w-full p-3 flex items-center justify-between hover:bg-slate-800/80 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatarUrl}
                    alt={u.username}
                    className="w-8 h-8 rounded-full object-cover border border-indigo-500/30"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      @{u.username}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {u.statusMessage || u.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <PresenceBadge isOnline={u.isOnline} lastSeen={u.lastSeen} showText={false} />
                  <UserPlus className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
