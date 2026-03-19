## Why

Film selections are stored in browser localStorage, making them inaccessible across devices. Users typically curate their festival plan on a laptop but need it on their phone at the cinema. There's no way to transfer or sync selections without manually re-entering them.

## What Changes

- Add a Cloudflare Pages Function (`/api/sync/[token]`) backed by KV storage for persisting plan data server-side
- Evolve the localStorage schema (v2→v3) to track per-item timestamps, enabling correct merge semantics for adds and removes
- Add a sync modal UI with 4-character code display, QR code, copy-link, and join-by-code flow
- Add auto-sync on every plan/favourites change (debounced 3s) when a sync token is present
- Add a persistent sync status badge on the Plan page header showing sync state
- Add merge summary toast showing what changed after syncing from another device
- Support the `?sync=<token>` query parameter on the Plan page for one-click device linking

## Capabilities

### New Capabilities
- `sync-api`: Cloudflare Pages Function with KV binding for reading and writing plan data by anonymous token, with server-side timestamp-based merge
- `sync-client`: Client-side sync hook managing token lifecycle, debounced auto-push, initial pull on mount, and merge application to React contexts
- `sync-ui`: Sync modal (code display, QR, copy link, join flow), persistent sync badge, merge summary toast, and `?sync=` query param handling

### Modified Capabilities
- `storage-utils`: Evolve StorageData schema to v3 with per-item timestamps and sync token; add migration from v2; add merge logic for plan, favourites, and ticketQuantities
- `film-favourites`: FavouritesContext and PlanContext must notify the sync hook on state changes and accept merged state updates from remote sync

## Impact

- `wrangler.toml` — add KV namespace binding
- `functions/api/sync/[token].ts` — new Pages Function (GET/PUT)
- `src/lib/storage.ts` — v3 schema, migration, merge functions
- `src/hooks/useSyncPlan.ts` — new sync lifecycle hook
- `src/components/SyncModal.tsx` — new modal component
- `src/components/SyncBadge.tsx` — new badge component
- `src/components/PlanPageClient.tsx` — wire sync hook, badge, modal, `?sync=` param
- `src/components/PlanContext.tsx` — expose change notifications for sync
- `src/components/FavouritesContext.tsx` — expose change notifications for sync
- New dependency: QR code generation library (e.g. `qrcode` or `qrcode.react`)
- Cloudflare KV namespace must be provisioned (`wrangler kv namespace create SYNC_KV`)
