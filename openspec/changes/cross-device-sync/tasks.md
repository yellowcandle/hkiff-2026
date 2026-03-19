## 1. Infrastructure Setup

- [x] 1.1 Create KV namespace via `wrangler kv namespace create SYNC_KV` and add binding to `wrangler.toml`
- [x] 1.2 Install QR code generation dependency (`qrcode.react` or similar)

## 2. Storage Layer (v3 Schema)

- [x] 2.1 Define v3 `StorageData` interface with per-item timestamps, removed map, and syncToken field in `src/lib/storage.ts`
- [x] 2.2 Implement v2→v3 migration in `loadStorage()` (wrap existing plan/favourites arrays into timestamped maps)
- [x] 2.3 Update `saveStorage()` to write v3 format
- [x] 2.4 Implement `mergeState(local, remote)` function with per-item timestamp comparison
- [x] 2.5 Implement `toSyncPayload(state)` function to convert v3 local state to API format
- [x] 2.6 Update type guard `isStorageData()` to validate v3 shape

## 3. Sync API (Pages Function)

- [x] 3.1 Create `functions/api/sync/[token].ts` with request routing for GET, PUT, OPTIONS
- [x] 3.2 Implement token validation (4-char alphanumeric from allowed alphabet)
- [x] 3.3 Implement GET handler: read from KV, return JSON or 404
- [x] 3.4 Implement PUT handler: read existing KV, merge with request body, write merged result with 30-day TTL, return merged data
- [x] 3.5 Add CORS headers for same-origin requests

## 4. Context Updates

- [x] 4.1 Update PlanContext to use v3 storage format (timestamped adds/removes) and expose `applyMergedState()` method
- [x] 4.2 Update FavouritesContext to use v3 storage format and expose `applyMergedState()` method
- [x] 4.3 Add change notification callbacks to both contexts (for sync hook to subscribe to)

## 5. Sync Client Hook

- [x] 5.1 Create `src/hooks/useSyncPlan.ts` with token generation (4-char from reduced alphabet)
- [x] 5.2 Implement debounced auto-push (3s) on plan/favourites changes
- [x] 5.3 Implement initial pull on mount when syncToken exists
- [x] 5.4 Implement merge application (call `applyMergedState` on both contexts without re-triggering sync)
- [x] 5.5 Expose sync status (idle, syncing, synced, error) and sync code

## 6. Sync UI Components

- [x] 6.1 Create `src/components/SyncBadge.tsx` — persistent badge showing sync state and code, clickable to open modal
- [x] 6.2 Create `src/components/SyncModal.tsx` — code display (4 boxes), QR code, copy link button, join input with sync button, info footer
- [x] 6.3 Create merge summary toast component showing adds/removes after sync
- [x] 6.4 Add "Sync Devices" button to Plan page header actions

## 7. Plan Page Integration

- [x] 7.1 Wire `useSyncPlan` hook into `PlanPageClient.tsx`
- [x] 7.2 Add `?sync=` query parameter detection on mount — trigger join flow, show merge summary, clean URL
- [x] 7.3 Add confirmation dialog when `?sync=` token differs from existing token
- [x] 7.4 Render SyncBadge and SyncModal in Plan page layout

## 8. Testing & Deployment

- [x] 8.1 Test v2→v3 migration with existing localStorage data
- [x] 8.2 Test merge logic: concurrent adds, concurrent removes, mixed add/remove conflicts
- [x] 8.3 Test sync API locally with `wrangler pages dev`
- [x] 8.4 Test full flow: create code on device A, join on device B, verify merge
- [x] 8.5 Deploy to Cloudflare Pages with KV binding configured
