"use client";

import type { SyncStatus } from "@/hooks/useSyncPlan";

interface SyncBadgeProps {
  syncCode: string | null;
  syncStatus: SyncStatus;
  onClick: () => void;
}

export default function SyncBadge({
  syncCode,
  syncStatus,
  onClick,
}: SyncBadgeProps) {
  if (!syncCode) return null;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        syncStatus === "error"
          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
          : "bg-green-100 text-green-800 hover:bg-green-200"
      }`}
    >
      {syncStatus === "syncing" && (
        <svg
          className="w-3 h-3 animate-spin"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="8"
            cy="8"
            r="6.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="32"
            strokeDashoffset="8"
            strokeLinecap="round"
          />
        </svg>
      )}
      {syncStatus === "synced" && (
        <svg
          className="w-3 h-3"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
        </svg>
      )}
      {syncStatus === "error" && (
        <svg
          className="w-3 h-3"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM7.25 4.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5ZM8 11.5A.75.75 0 1 1 8 10a.75.75 0 0 1 0 1.5Z" />
        </svg>
      )}
      {syncStatus === "idle" && (
        <svg
          className="w-3 h-3"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
        </svg>
      )}
      <span>
        {syncStatus === "syncing"
          ? `Syncing: ${syncCode}`
          : syncStatus === "error"
          ? `Sync error: ${syncCode}`
          : `Synced: ${syncCode}`}
      </span>
    </button>
  );
}
