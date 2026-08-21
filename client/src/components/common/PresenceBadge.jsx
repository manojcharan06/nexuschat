'use client';

export default function PresenceBadge({ isOnline, lastSeen, showText = true }) {
  const formatLastSeen = (dateString) => {
    if (!dateString) return 'Offline';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Last seen just now';
    if (diffInSeconds < 3600) return `Last seen ${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `Last seen ${Math.floor(diffInSeconds / 3600)}h ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2.5 w-2.5">
        {isOnline ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-500"></span>
        )}
      </span>

      {showText && (
        <span
          className={`text-xs font-medium ${
            isOnline ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          {isOnline ? 'Online' : formatLastSeen(lastSeen)}
        </span>
      )}
    </div>
  );
}
