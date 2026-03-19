const STORAGE_KEY = "hkiff50-data";
const LEGACY_KEY = "hkiff50-plan";
const CURRENT_VERSION = 3;

// --- V2 types (for migration) ---
interface StorageDataV2 {
  version: number;
  plan: string[];
  favourites: string[];
  ticketQuantities: Record<string, number>;
}

// --- V3 types ---
export interface TimestampedItem {
  at: number;
  qty?: number;
}

export interface SyncPayloadItem {
  state: "added" | "removed";
  at: number;
  qty?: number;
}

export interface SyncPayload {
  plan: Record<string, SyncPayloadItem>;
  favourites: Record<string, SyncPayloadItem>;
  lastModified: number;
}

export interface StorageData {
  version: number;
  plan: Record<string, TimestampedItem>;
  favourites: Record<string, TimestampedItem>;
  removed: Record<string, TimestampedItem>;
  syncToken: string | null;
}

const DEFAULTS: StorageData = {
  version: CURRENT_VERSION,
  plan: {},
  favourites: {},
  removed: {},
  syncToken: null,
};

// --- Helpers for contexts (convert v3 maps to arrays for backward compat) ---
export function planIds(data: StorageData): string[] {
  return Object.keys(data.plan);
}

export function favouriteIds(data: StorageData): string[] {
  return Object.keys(data.favourites);
}

export function ticketQuantitiesMap(data: StorageData): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, item] of Object.entries(data.plan)) {
    if (item.qty && item.qty > 1) result[id] = item.qty;
  }
  return result;
}

// --- Type guards ---
function isStorageDataV2(val: unknown): val is StorageDataV2 {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return (
    typeof obj.version === "number" &&
    obj.version <= 2 &&
    Array.isArray(obj.plan) &&
    obj.plan.every((x) => typeof x === "string") &&
    Array.isArray(obj.favourites) &&
    obj.favourites.every((x) => typeof x === "string")
  );
}

export function isStorageData(val: unknown): val is StorageData {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return (
    typeof obj.version === "number" &&
    obj.version >= 3 &&
    typeof obj.plan === "object" && obj.plan !== null && !Array.isArray(obj.plan) &&
    typeof obj.favourites === "object" && obj.favourites !== null && !Array.isArray(obj.favourites) &&
    typeof obj.removed === "object" && obj.removed !== null && !Array.isArray(obj.removed)
  );
}

// --- Migrations ---
function migrateV2toV3(data: StorageDataV2): StorageData {
  const now = Date.now();
  const plan: Record<string, TimestampedItem> = {};
  for (const id of data.plan) {
    plan[id] = { at: now, qty: data.ticketQuantities?.[id] };
  }
  const favourites: Record<string, TimestampedItem> = {};
  for (const id of data.favourites) {
    favourites[id] = { at: now };
  }
  return { version: 3, plan, favourites, removed: {}, syncToken: null };
}

function migrateLegacy(): StorageData | null {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return null;
    const parsed = JSON.parse(legacy);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      const now = Date.now();
      const plan: Record<string, TimestampedItem> = {};
      for (const id of parsed) {
        plan[id] = { at: now };
      }
      localStorage.removeItem(LEGACY_KEY);
      return { ...DEFAULTS, plan };
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore malformed legacy data
  }
  return null;
}

// --- Load / Save ---
export function loadStorage(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);

      // Already v3
      if (isStorageData(parsed)) {
        localStorage.removeItem(LEGACY_KEY);
        return parsed;
      }

      // V2 migration
      if (isStorageDataV2(parsed)) {
        localStorage.removeItem(LEGACY_KEY);
        const migrated = migrateV2toV3(parsed);
        saveStorage(migrated);
        return migrated;
      }
    }
    // Try legacy migration
    const migrated = migrateLegacy();
    if (migrated) {
      saveStorage(migrated);
      return migrated;
    }
  } catch {
    // corrupt JSON — fall through to defaults
  }
  return { ...DEFAULTS };
}

export function saveStorage(data: StorageData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: CURRENT_VERSION }));
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      return false;
    }
    return false;
  }
}

// --- Sync payload conversion ---
export function toSyncPayload(data: StorageData): SyncPayload {
  const plan: Record<string, SyncPayloadItem> = {};
  for (const [id, item] of Object.entries(data.plan)) {
    plan[id] = { state: "added", at: item.at, qty: item.qty };
  }
  for (const [id, item] of Object.entries(data.removed)) {
    // Only include removed plan items (screening IDs start with "s-")
    if (id.startsWith("s-")) {
      plan[id] = { state: "removed", at: item.at };
    }
  }

  const favourites: Record<string, SyncPayloadItem> = {};
  for (const [id, item] of Object.entries(data.favourites)) {
    favourites[id] = { state: "added", at: item.at };
  }
  for (const [id, item] of Object.entries(data.removed)) {
    // Non-screening IDs are favourites
    if (!id.startsWith("s-")) {
      favourites[id] = { state: "removed", at: item.at };
    }
  }

  return {
    plan,
    favourites,
    lastModified: Date.now(),
  };
}

// --- Merge logic ---
export interface MergeSummary {
  screeningsAdded: number;
  screeningsRemoved: number;
  favouritesAdded: number;
  favouritesRemoved: number;
}

export function mergeState(local: StorageData, remote: SyncPayload): { merged: StorageData; summary: MergeSummary } {
  const localPayload = toSyncPayload(local);
  const summary: MergeSummary = { screeningsAdded: 0, screeningsRemoved: 0, favouritesAdded: 0, favouritesRemoved: 0 };

  // Merge plan items
  const mergedPlan: Record<string, TimestampedItem> = { ...local.plan };
  const mergedRemoved: Record<string, TimestampedItem> = { ...local.removed };

  for (const [id, remoteItem] of Object.entries(remote.plan)) {
    const localItem = localPayload.plan[id];
    const localAt = localItem?.at ?? 0;

    if (remoteItem.at > localAt) {
      if (remoteItem.state === "added") {
        if (!local.plan[id]) summary.screeningsAdded++;
        mergedPlan[id] = { at: remoteItem.at, qty: remoteItem.qty };
        delete mergedRemoved[id];
      } else {
        if (local.plan[id]) summary.screeningsRemoved++;
        delete mergedPlan[id];
        mergedRemoved[id] = { at: remoteItem.at };
      }
    }
  }

  // Merge favourites
  const mergedFavourites: Record<string, TimestampedItem> = { ...local.favourites };

  for (const [id, remoteItem] of Object.entries(remote.favourites)) {
    const localItem = localPayload.favourites[id];
    const localAt = localItem?.at ?? 0;

    if (remoteItem.at > localAt) {
      if (remoteItem.state === "added") {
        if (!local.favourites[id]) summary.favouritesAdded++;
        mergedFavourites[id] = { at: remoteItem.at };
        delete mergedRemoved[id];
      } else {
        if (local.favourites[id]) summary.favouritesRemoved++;
        delete mergedFavourites[id];
        mergedRemoved[id] = { at: remoteItem.at };
      }
    }
  }

  return {
    merged: {
      ...local,
      plan: mergedPlan,
      favourites: mergedFavourites,
      removed: mergedRemoved,
    },
    summary,
  };
}
