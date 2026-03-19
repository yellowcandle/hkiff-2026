"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePlan } from "@/components/PlanContext";
import { useFavourites } from "@/components/FavouritesContext";
import {
  loadStorage,
  saveStorage,
  toSyncPayload,
  mergeState,
  MergeSummary,
  SyncPayload,
} from "@/lib/storage";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface UseSyncPlanReturn {
  syncCode: string | null;
  syncStatus: SyncStatus;
  enableSync: () => void;
  joinSync: (code: string) => Promise<MergeSummary | null>;
  mergeSummary: MergeSummary | null;
  dismissSummary: () => void;
}

const SYNC_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const SYNC_CODE_LENGTH = 4;
const DEBOUNCE_MS = 3000;

function generateSyncCode(): string {
  const values = crypto.getRandomValues(new Uint8Array(SYNC_CODE_LENGTH));
  return Array.from(values)
    .map((v) => SYNC_ALPHABET[v % SYNC_ALPHABET.length])
    .join("");
}

export function useSyncPlan(): UseSyncPlanReturn {
  const { applyMergedState: applyPlanMerge, onPlanChange } = usePlan();
  const {
    applyMergedState: applyFavouritesMerge,
    onFavouritesChange,
  } = useFavourites();

  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [mergeSummary, setMergeSummary] = useState<MergeSummary | null>(null);

  const skipSyncRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncCodeRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    syncCodeRef.current = syncCode;
  }, [syncCode]);

  // Load syncToken from storage on mount
  useEffect(() => {
    const data = loadStorage();
    if (data.syncToken) {
      setSyncCode(data.syncToken);
    }
  }, []);

  // Initial pull on mount when syncToken exists
  useEffect(() => {
    if (!syncCode) return;
    let cancelled = false;

    async function initialPull() {
      try {
        setSyncStatus("syncing");
        const res = await fetch(`/api/sync/${syncCode}`);
        if (!res.ok) {
          setSyncStatus("error");
          return;
        }
        const remote: SyncPayload = await res.json();
        if (cancelled) return;

        const local = loadStorage();
        const { merged, summary } = mergeState(local, remote);

        skipSyncRef.current = true;
        applyPlanMerge(merged.plan, merged.removed);
        applyFavouritesMerge(merged.favourites, merged.removed);
        saveStorage(merged);

        const hasChanges =
          summary.screeningsAdded > 0 ||
          summary.screeningsRemoved > 0 ||
          summary.favouritesAdded > 0 ||
          summary.favouritesRemoved > 0;
        if (hasChanges) {
          setMergeSummary(summary);
        }
        setSyncStatus("synced");
      } catch {
        if (!cancelled) setSyncStatus("error");
      }
    }

    initialPull();
    return () => {
      cancelled = true;
    };
    // Only run on initial mount when syncCode first loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncCode ? "loaded" : "none"]);

  // Debounced sync push
  const doSync = useCallback(async () => {
    const code = syncCodeRef.current;
    if (!code) return;

    try {
      setSyncStatus("syncing");
      const payload = toSyncPayload(loadStorage());
      const res = await fetch(`/api/sync/${code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setSyncStatus("error");
        return;
      }

      const remote: SyncPayload = await res.json();
      const local = loadStorage();
      const { merged, summary } = mergeState(local, remote);

      skipSyncRef.current = true;
      applyPlanMerge(merged.plan, merged.removed);
      applyFavouritesMerge(merged.favourites, merged.removed);
      saveStorage(merged);

      const hasChanges =
        summary.screeningsAdded > 0 ||
        summary.screeningsRemoved > 0 ||
        summary.favouritesAdded > 0 ||
        summary.favouritesRemoved > 0;
      if (hasChanges) {
        setMergeSummary(summary);
      }
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
  }, [applyPlanMerge, applyFavouritesMerge]);

  const scheduleDebouncedSync = useCallback(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    if (!syncCodeRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      doSync();
    }, DEBOUNCE_MS);
  }, [doSync]);

  // Subscribe to plan and favourites changes
  useEffect(() => {
    const unsubPlan = onPlanChange(scheduleDebouncedSync);
    const unsubFavourites = onFavouritesChange(scheduleDebouncedSync);
    return () => {
      unsubPlan();
      unsubFavourites();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [onPlanChange, onFavouritesChange, scheduleDebouncedSync]);

  const enableSync = useCallback(() => {
    const code = generateSyncCode();
    setSyncCode(code);
    syncCodeRef.current = code;

    // Save token to storage
    const data = loadStorage();
    data.syncToken = code;
    saveStorage(data);

    // Do first push
    const payload = toSyncPayload(loadStorage());
    setSyncStatus("syncing");
    fetch(`/api/sync/${code}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.ok) {
          setSyncStatus("synced");
        } else {
          setSyncStatus("error");
        }
      })
      .catch(() => {
        setSyncStatus("error");
      });
  }, []);

  const joinSync = useCallback(
    async (code: string): Promise<MergeSummary | null> => {
      try {
        setSyncStatus("syncing");
        const res = await fetch(`/api/sync/${code}`);
        if (res.status === 404) {
          setSyncStatus("idle");
          return null;
        }
        if (!res.ok) {
          setSyncStatus("error");
          return null;
        }

        const remote: SyncPayload = await res.json();
        const local = loadStorage();
        const { merged, summary } = mergeState(local, remote);

        skipSyncRef.current = true;
        applyPlanMerge(merged.plan, merged.removed);
        applyFavouritesMerge(merged.favourites, merged.removed);

        // Save token and merged state
        merged.syncToken = code;
        saveStorage(merged);

        setSyncCode(code);
        syncCodeRef.current = code;
        setMergeSummary(summary);
        setSyncStatus("synced");

        // Push local state back so both devices converge
        const pushPayload = toSyncPayload(loadStorage());
        fetch(`/api/sync/${code}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pushPayload),
        }).catch(() => {
          // Best effort push-back
        });

        return summary;
      } catch {
        setSyncStatus("error");
        return null;
      }
    },
    [applyPlanMerge, applyFavouritesMerge]
  );

  const dismissSummary = useCallback(() => {
    setMergeSummary(null);
  }, []);

  return {
    syncCode,
    syncStatus,
    enableSync,
    joinSync,
    mergeSummary,
    dismissSummary,
  };
}
