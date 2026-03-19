// Minimal Cloudflare Workers types (avoids @cloudflare/workers-types dependency)
interface KVNamespace {
  get(key: string): Promise<string | null>;
  get<T>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface CFContext {
  request: Request;
  env: { SYNC_KV: KVNamespace };
  params: Record<string, string | string[]>;
}

interface ItemState {
  state: "added" | "removed";
  at: number;
  qty?: number;
}

interface FavState {
  state: "added" | "removed";
  at: number;
}

interface SyncData {
  plan: Record<string, ItemState>;
  favourites: Record<string, FavState>;
  lastModified: number;
}

const TOKEN_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const TOKEN_LENGTH = 4;
const KV_TTL = 2592000; // 30 days

function isValidToken(token: string): boolean {
  if (token.length !== TOKEN_LENGTH) return false;
  for (const ch of token) {
    if (!TOKEN_ALPHABET.includes(ch)) return false;
  }
  return true;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

function mergeRecords<T extends { at: number }>(
  existing: Record<string, T> | undefined,
  incoming: Record<string, T> | undefined
): Record<string, T> {
  const merged: Record<string, T> = {};
  const allKeys = new Set([
    ...Object.keys(existing ?? {}),
    ...Object.keys(incoming ?? {}),
  ]);
  for (const key of allKeys) {
    const a = existing?.[key];
    const b = incoming?.[key];
    if (!a) {
      merged[key] = b!;
    } else if (!b) {
      merged[key] = a;
    } else {
      merged[key] = b.at >= a.at ? b : a;
    }
  }
  return merged;
}

function mergeSyncData(
  existing: SyncData | null,
  incoming: SyncData
): SyncData {
  if (!existing) return incoming;
  const plan = mergeRecords(existing.plan, incoming.plan);
  const favourites = mergeRecords(existing.favourites, incoming.favourites);
  const lastModified = Math.max(
    existing.lastModified ?? 0,
    incoming.lastModified ?? 0
  );
  return { plan, favourites, lastModified };
}

export async function onRequestGet(context: CFContext): Promise<Response> {
  const token = (context.params.token as string).toUpperCase();
  if (!isValidToken(token)) {
    return jsonResponse({ error: "invalid_token" }, 400);
  }

  const data = await context.env.SYNC_KV.get(token, "json");
  if (!data) {
    return jsonResponse({ error: "not_found" }, 404);
  }
  return jsonResponse(data);
}

export async function onRequestPut(context: CFContext): Promise<Response> {
  const token = (context.params.token as string).toUpperCase();
  if (!isValidToken(token)) {
    return jsonResponse({ error: "invalid_token" }, 400);
  }

  const incoming = (await context.request.json()) as SyncData;
  const existing = await context.env.SYNC_KV.get<SyncData>(token, "json");
  const merged = mergeSyncData(existing, incoming);

  await context.env.SYNC_KV.put(token, JSON.stringify(merged), {
    expirationTtl: KV_TTL,
  });

  return jsonResponse(merged);
}

export async function onRequestOptions(_context: CFContext): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
