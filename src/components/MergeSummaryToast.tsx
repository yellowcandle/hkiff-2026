"use client";

import { useEffect } from "react";
import type { MergeSummary } from "@/lib/storage";

interface MergeSummaryToastProps {
  summary: MergeSummary | null;
  onDismiss: () => void;
}

export default function MergeSummaryToast({
  summary,
  onDismiss,
}: MergeSummaryToastProps) {
  useEffect(() => {
    if (!summary) return;

    const hasChanges =
      summary.screeningsAdded > 0 ||
      summary.screeningsRemoved > 0 ||
      summary.favouritesAdded > 0 ||
      summary.favouritesRemoved > 0;

    if (!hasChanges) return;

    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [summary, onDismiss]);

  if (!summary) return null;

  const hasChanges =
    summary.screeningsAdded > 0 ||
    summary.screeningsRemoved > 0 ||
    summary.favouritesAdded > 0 ||
    summary.favouritesRemoved > 0;

  if (!hasChanges) return null;

  const changes: string[] = [];
  if (summary.screeningsAdded > 0) {
    changes.push(`+${summary.screeningsAdded} screening${summary.screeningsAdded > 1 ? "s" : ""} added`);
  }
  if (summary.screeningsRemoved > 0) {
    changes.push(`-${summary.screeningsRemoved} screening${summary.screeningsRemoved > 1 ? "s" : ""} removed`);
  }
  if (summary.favouritesAdded > 0) {
    changes.push(`+${summary.favouritesAdded} favourite${summary.favouritesAdded > 1 ? "s" : ""} added`);
  }
  if (summary.favouritesRemoved > 0) {
    changes.push(`-${summary.favouritesRemoved} favourite${summary.favouritesRemoved > 1 ? "s" : ""} removed`);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-bottom-4">
      <div className="bg-white border border-neutral-200 rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          {/* Green checkmark */}
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-green-600"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900">
              Synced successfully!
            </p>
            <ul className="mt-1 space-y-0.5">
              {changes.map((change, i) => (
                <li key={i} className="text-xs text-neutral-500">
                  {change}
                </li>
              ))}
            </ul>
          </div>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.28 3.22a.75.75 0 0 0-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06L8 9.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L9.06 8l3.72-3.72a.75.75 0 0 0-1.06-1.06L8 6.94 4.28 3.22Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
