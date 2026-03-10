## Context

The HKIFF 2026 site is a Next.js 15 app with React 19 and Tailwind CSS 4. User plan state (selected screening IDs) is already managed via `PlanContext.tsx` with direct `localStorage` calls. There is no film-level favouriting, no storage versioning, and no error handling for storage-full scenarios.

All data is client-side only — no authentication or backend persistence.

## Goals / Non-Goals

**Goals:**
- Centralise all `localStorage` access into a typed utility module (`src/lib/storage.ts`)
- Add schema versioning so future data shape changes can be migrated automatically
- Introduce a film-favourites feature (star/bookmark films) separate from screening selections
- Handle `QuotaExceededError` gracefully with user feedback
- Keep the existing `PlanContext` API surface unchanged for consumers

**Non-Goals:**
- Backend persistence or user accounts
- Cross-device sync (e.g. via URL hash or cloud storage)
- Offline-first / service worker caching
- Migrating away from `localStorage` to IndexedDB

## Decisions

### 1. Single storage utility module
**Decision**: Create `src/lib/storage.ts` that wraps all `localStorage` reads/writes.

**Rationale**: Direct `localStorage` calls are scattered and lack error handling. A single module makes versioning, error handling, and testing straightforward.

**Alternatives considered**:
- Keep direct calls — rejected because it duplicates error handling and makes versioning hard.
- Use a library (e.g. `localforage`) — rejected to avoid adding dependencies for a simple use case.

### 2. Versioned storage envelope
**Decision**: Store data as `{ version: number, plan: string[], favourites: string[] }` under a single key `hkiff50-data`.

**Rationale**: A single versioned envelope lets us migrate all user data atomically. The old `hkiff50-plan` key will be migrated on first load and removed.

**Alternatives considered**:
- Separate keys per feature — simpler but makes coordinated versioning harder.
- Use a version key separately — rejected because atomic read/write of envelope is cleaner.

### 3. Film favourites as a flat ID array
**Decision**: Store favourites as `string[]` of film IDs, same pattern as plan screening IDs.

**Rationale**: Consistent with the existing plan pattern. Films have stable IDs from the data layer. A Set would be more efficient for lookups but doesn't serialise to JSON natively.

### 4. React context for favourites
**Decision**: Add a `FavouritesContext` provider alongside `PlanProvider`, following the same pattern.

**Rationale**: Keeps concerns separated. The favourites context is simpler (no conflict detection). Consumers use `useFavourites()` hook.

## Risks / Trade-offs

- **[localStorage quota]** → `storage.ts` catches `QuotaExceededError` and returns `false` from write operations; UI shows a toast/message. Realistic risk is low — a few hundred screening/film IDs is well under 5MB.
- **[Migration from old key]** → On first load, if `hkiff50-plan` exists but `hkiff50-data` doesn't, migrate data. If both exist, prefer `hkiff50-data`. Old key is deleted after migration.
- **[SSR hydration mismatch]** → `localStorage` is only accessed in `useEffect`, matching the existing pattern. Initial render uses empty state.
