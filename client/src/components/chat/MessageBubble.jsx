'use client';

import { Check, CheckCheck, Clock } from 'lucide-react';

export default function MessageBubble({ message, isOwn }) {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isSending = message.status === 'sending' || !!message.tempId && !message._id;

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-3`}>
      <div
        className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-md text-xs sm:text-sm leading-relaxed space-y-1 relative group ${
          isOwn
            ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-950/40'
            : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/50 shadow-slate-950/40'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>

        <div
          className={`flex items-center justify-end gap-1.5 text-[10px] ${
            isOwn ? 'text-indigo-200' : 'text-slate-400'
          }`}
        >
          <span>{formatTime(message.createdAt || new Date())}</span>

          {isOwn && (
            <span>
              {isSending ? (
                <Clock className="w-3 h-3 animate-spin text-indigo-300" />
              ) : message.status === 'seen' ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />
              ) : (
                <Check className="w-3.5 h-3.5 text-indigo-200" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
