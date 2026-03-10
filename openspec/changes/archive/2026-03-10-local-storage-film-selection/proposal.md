## Why

Users browsing the HKIFF 2026 catalogue need their selected films and screening schedule to persist across browser sessions without requiring login or a backend. The current `PlanContext` already uses `localStorage` for screening IDs, but lacks robustness: there is no data versioning, no storage-full handling, and no mechanism to bookmark/favourite individual films separately from screening selections.

## What Changes

- Add a `film-favourites` localStorage layer so users can star/bookmark films independently of scheduling specific screenings
- Add a storage versioning scheme so future data shape changes don't corrupt existing user selections
- Add storage-full error handling with user feedback
- Consolidate all localStorage access into a single utility module (`src/lib/storage.ts`) to avoid scattered `localStorage` calls

## Capabilities

### New Capabilities
- `film-favourites`: Client-side bookmarking of films, persisted in localStorage, separate from the screening plan
- `storage-utils`: Versioned localStorage wrapper with error handling, migration support, and a single access point for all persisted user data

### Modified Capabilities

## Impact

- `src/components/PlanContext.tsx` — refactor to use new storage utility instead of direct `localStorage` calls
- `src/lib/storage.ts` — new module
- `src/components/FilmCard.tsx` — add favourite toggle UI
- `src/components/FilmCatalogueClient.tsx` — filter by favourites option
- No backend or API changes required
- No dependencies added
