const STORAGE_KEY = "hkiff50-data";
const LEGACY_KEY = "hkiff50-plan";
const CURRENT_VERSION = 2;

export interface StorageData {
  version: number;
  plan: string[];
  favourites: string[];
  ticketQuantities: Record<string, number>;
}

const DEFAULTS: StorageData = { version: CURRENT_VERSION, plan: [], favourites: [], ticketQuantities: {} };

function isStorageData(val: unknown): val is StorageData {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return (
    typeof obj.version === "number" &&
    Array.isArray(obj.plan) &&
    obj.plan.every((x) => typeof x === "string") &&
    Array.isArray(obj.favourites) &&
    obj.favourites.every((x) => typeof x === "string")
  );
}

function migrateV1toV2(data: StorageData): StorageData {
  if (!data.ticketQuantities) {
    data.ticketQuantities = {};
  }
  data.version = 2;
  return data;
}

function migrateLegacy(): StorageData | null {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return null;
    const parsed = JSON.parse(legacy);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      const migrated: StorageData = { ...DEFAULTS, plan: parsed };
      localStorage.removeItem(LEGACY_KEY);
      return migrated;
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore malformed legacy data
  }
  return null;
}

export function loadStorage(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isStorageData(parsed)) {
        // Clean up legacy key if it still exists
        localStorage.removeItem(LEGACY_KEY);
        // Migrate v1 → v2
        if (parsed.version < 2) {
          const migrated = migrateV1toV2(parsed);
          saveStorage(migrated);
          return migrated;
        }
        return parsed;
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
