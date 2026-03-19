"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { SyncStatus } from "@/hooks/useSyncPlan";
import type { MergeSummary } from "@/lib/storage";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncCode: string | null;
  syncStatus: SyncStatus;
  onEnableSync: () => void;
  onJoinSync: (code: string) => Promise<MergeSummary | null>;
}

export default function SyncModal({
  isOpen,
  onClose,
  syncCode,
  syncStatus,
  onEnableSync,
  onJoinSync,
}: SyncModalProps) {
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const syncUrl =
    typeof window !== "undefined" && syncCode
      ? `${window.location.origin}/en/plan?sync=${syncCode}`
      : "";

  async function handleCopyLink() {
    if (!syncUrl) return;
    try {
      await navigator.clipboard.writeText(syncUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 4) return;

    setJoinError(false);
    setJoining(true);
    try {
      const result = await onJoinSync(code);
      if (result === null) {
        setJoinError(true);
      } else {
        setJoinCode("");
        onClose();
      }
    } finally {
      setJoining(false);
    }
  }

  // First-time setup: show "Start Syncing" button
  if (!syncCode) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-2">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">
                Sync Your Plan
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Access your selections on any device. No account needed.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          <div className="p-6 pt-4 space-y-6">
            <button
              onClick={() => {
                onEnableSync();
              }}
              className="w-full bg-red-600 text-white text-sm font-medium py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Start Syncing
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-neutral-500">or</span>
              </div>
            </div>

            {/* Join section */}
            <div>
              <p className="text-sm text-neutral-600 mb-3">
                Have a sync code from another device?
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase());
                    setJoinError(false);
                  }}
                  placeholder="XXXX"
                  className="flex-1 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm font-mono text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  onClick={handleJoin}
                  disabled={joinCode.trim().length !== 4 || joining}
                  className="bg-neutral-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {joining ? "..." : "Sync"}
                </button>
              </div>
              {joinError && (
                <p className="text-sm text-red-600 mt-2">
                  Code not found. Check and try again.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active sync: show code, QR, copy link, join section
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-2">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Sync Your Plan
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Access your selections on any device. No account needed.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="p-6 pt-4 space-y-6">
          {/* Code display */}
          <div className="text-center">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Your Sync Code
            </p>
            <div className="flex justify-center gap-2">
              {syncCode.split("").map((char, i) => (
                <div
                  key={i}
                  className="w-12 h-14 flex items-center justify-center border-2 border-neutral-200 rounded-lg text-2xl font-bold font-mono text-neutral-900"
                >
                  {char}
                </div>
              ))}
            </div>
            {syncStatus === "syncing" && (
              <p className="text-xs text-neutral-500 mt-2">Syncing...</p>
            )}
            {syncStatus === "synced" && (
              <p className="text-xs text-green-600 mt-2">Synced</p>
            )}
            {syncStatus === "error" && (
              <p className="text-xs text-amber-600 mt-2">
                Sync error. Will retry.
              </p>
            )}
          </div>

          {/* QR code */}
          {syncUrl && (
            <div className="flex justify-center">
              <div className="p-3 bg-white border border-neutral-100 rounded-xl">
                <QRCodeSVG
                  value={syncUrl}
                  size={160}
                  level="M"
                  bgColor="transparent"
                />
              </div>
            </div>
          )}

          {/* Copy link button */}
          <button
            onClick={handleCopyLink}
            className="w-full border border-neutral-200 text-neutral-700 text-sm font-medium py-2.5 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            {copied ? "Copied!" : "Copy Sync Link"}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-neutral-500">or</span>
            </div>
          </div>

          {/* Join section */}
          <div>
            <p className="text-sm text-neutral-600 mb-3">
              Have a sync code from another device?
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError(false);
                }}
                placeholder="XXXX"
                className="flex-1 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm font-mono text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                onClick={handleJoin}
                disabled={joinCode.trim().length !== 4 || joining}
                className="bg-neutral-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {joining ? "..." : "Sync"}
              </button>
            </div>
            {joinError && (
              <p className="text-sm text-red-600 mt-2">
                Code not found. Check and try again.
              </p>
            )}
          </div>

          {/* Info footer */}
          <p className="text-xs text-neutral-400 text-center">
            Your data syncs automatically when you make changes. Share this code
            with your other devices to keep your plan in sync.
          </p>
        </div>
      </div>
    </div>
  );
}
